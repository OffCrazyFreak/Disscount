#!/usr/bin/env bash
# Puts one commit's images live on an environment. On dev, a release that never goes live is
# replaced by the one that was serving before it, and the job still fails.
# Reads RELEASE_ID, ENVIRONMENT_TAG, APP_URL, DOKPLOY_URL, DOKPLOY_API_KEY and COMPOSE_ID.
set -uo pipefail

POLL_SECONDS=15
# The CI key allows 10 requests, and its count only resets after 60 s without one. A denied request
# is a 401 even for the trigger, so reads stay further apart than that and the count never fills.
DOKPLOY_GAP_SECONDS=65
# Dev: the ceiling for a deploy Dokploy never reports as failed. Healthy deploys took 54 to 74 s,
# and compose gives up on the slowest healthcheck chain at 300 s.
# Only dev has proved the backstop, so prod keeps its long wait and its manual Rollback.
if [ "$ENVIRONMENT_TAG" = dev ]; then
  WAIT_MINUTES=5
else
  WAIT_MINUTES=15
fi

# Empty unless the site answers and calls itself healthy.
live_release() {
  curl --silent --fail --max-time 10 --retry 2 --retry-delay 3 --retry-all-errors "$APP_URL/health" |
    jq -r 'select(.status == "ok") | .releaseId // empty' 2>/dev/null || true
}

# The app tags move together, and only once every image exists, so the server never
# pulls a frontend from one commit and a backend or migrator from another.
move_tag() {
  local release="$1" commit_tag image images inspect_error
  # A frontend bundle carries its environment's public values, so prod has its own commit tags
  # and a Rollback can never put a dev build on production.
  commit_tag="sha-$release"
  if [ "$ENVIRONMENT_TAG" = prod ]; then
    commit_tag="prod-sha-$release"
  fi
  images="frontend migrator backend"
  for image in $images; do
    docker buildx imagetools inspect "ghcr.io/offcrazyfreak/disscount-$image:$commit_tag" >/dev/null || return 1
  done
  # Commits from before the backup image have none, so a Rollback to one leaves the backup tag where it is.
  if inspect_error="$(docker buildx imagetools inspect "ghcr.io/offcrazyfreak/disscount-backup:$commit_tag" 2>&1 >/dev/null)"; then
    images="$images backup"
  elif grep -qi "not found" <<<"$inspect_error"; then
    echo "::warning::No backup image for $release; the backup tag stays on its current commit."
  else
    echo "::error::Could not check the backup image: $inspect_error"
    return 1
  fi
  for image in $images; do
    docker buildx imagetools create \
      --tag "ghcr.io/offcrazyfreak/disscount-$image:$ENVIRONMENT_TAG" \
      "ghcr.io/offcrazyfreak/disscount-$image:$commit_tag" || {
      echo "::error::Moving $ENVIRONMENT_TAG failed at $image, so the tags may mix commits; re-run this job if this commit is still the branch tip, otherwise run Rollback (or, before Rollback is on main, push a revert) before any Redeploy."
      return 1
    }
  done
}

# Only the status code is printed, because Dokploy's response bodies can echo service
# settings into a public log.
trigger_deploy() {
  local status attempt
  for attempt in 1 2; do
    status=$(curl --silent --max-time 30 --output /dev/null --write-out '%{http_code}' \
      --request POST "$DOKPLOY_URL/api/compose.deploy" \
      --header "x-api-key: $DOKPLOY_API_KEY" \
      --header "Content-Type: application/json" \
      --data "{\"composeId\":\"$COMPOSE_ID\"}" || true)
    # A dev job right behind another can find the key's count full; the window clears it.
    if [ "$status" != 401 ] || [ "$attempt" = 2 ] || [ "$ENVIRONMENT_TAG" != dev ]; then
      break
    fi
    echo "Dokploy answered 401, possibly the rate limit; trying once more in $DOKPLOY_GAP_SECONDS s."
    sleep "$DOKPLOY_GAP_SECONDS"
  done
  if [[ "$status" != 2* ]]; then
    echo "::error::Dokploy did not accept the deploy (HTTP $status). The $ENVIRONMENT_TAG tag already points at $1; run Rollback with the last good commit (or, before Rollback is on main, push a revert) before any Redeploy."
    return 1
  fi
}

# compose.deploy only queues the job, so success means the site reporting the new commit.
# With before_deploy set, a failed deployment newer than it ends the wait early; an older
# failed record says nothing about this deploy.
wait_for_release() {
  local release="$1" before_deploy="$2" deadline=$((SECONDS + WAIT_MINUTES * 60)) id status
  local next_read=$((SECONDS + DOKPLOY_GAP_SECONDS))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if [ "$(live_release)" = "$release" ]; then
      echo "Live on $release."
      return 0
    fi
    if [ -n "$before_deploy" ] && [ "$SECONDS" -ge "$next_read" ]; then
      next_read=$((SECONDS + DOKPLOY_GAP_SECONDS))
      read -r id status <<<"$(newest_deployment)"
      if [ -n "$id" ] && [ "$id" != "$before_deploy" ] && { [ "$status" = "error" ] || [ "$status" = "cancelled" ]; }; then
        echo "Dokploy reports this deploy as $status after $SECONDS s."
        return 1
      fi
    fi
    sleep "$POLL_SECONDS"
  done
  echo "$release was not live within $WAIT_MINUTES minutes."
  return 1
}

# Prints "<id> <status>" of the newest deployment and nothing else from the response.
newest_deployment() {
  curl --silent --fail --max-time 30 --retry 2 --retry-delay 3 --retry-all-errors --get \
    --header "x-api-key: $DOKPLOY_API_KEY" \
    --data-urlencode "composeId=$COMPOSE_ID" \
    "$DOKPLOY_URL/api/deployment.allByCompose" |
    jq -r 'max_by(.createdAt) | "\(.deploymentId) \(.status)"' 2>/dev/null || true
}

# A deploy still queued or pulling has not replaced the frontend yet, so /health can report the
# previous release before anything is restored. A deployment newer than the tag move pulled it.
wait_for_restore() {
  local release="$1" before_restore="$2" deadline=$((SECONDS + WAIT_MINUTES * 60)) id status
  if [ -z "$before_restore" ]; then
    echo "::warning::Could not read the Dokploy deployments, so the restore cannot be confirmed."
    return 1
  fi
  while [ "$SECONDS" -lt "$deadline" ]; do
    sleep "$DOKPLOY_GAP_SECONDS"
    read -r id status <<<"$(newest_deployment)"
    if [ "$id" != "$before_restore" ] && [ "$status" = "done" ] && [ "$(live_release)" = "$release" ]; then
      return 0
    fi
  done
  return 1
}

restore_release() {
  local before_restore
  move_tag "$1" || return 1
  before_restore="$(newest_deployment | cut -d' ' -f1)"
  trigger_deploy "$1" || return 1
  wait_for_restore "$1" "$before_restore"
}

if ! [[ "$RELEASE_ID" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::release-id must be a full 40 character commit SHA."
  exit 1
fi

previous=""
if [ "$ENVIRONMENT_TAG" = dev ]; then
  previous="$(live_release)"
  if ! [[ "$previous" =~ ^[0-9a-f]{40}$ ]]; then
    echo "::warning::$APP_URL/health named no release before this deploy, so there is no known good release and the backstop is off for this run."
    previous=""
  elif [ "$previous" = "$RELEASE_ID" ]; then
    echo "$RELEASE_ID is already live, so there is no earlier release to go back to."
    previous=""
  else
    echo "Last good release: $previous."
  fi
fi

move_tag "$RELEASE_ID" || exit 1
before_deploy=""
if [ -n "$previous" ]; then
  before_deploy="$(newest_deployment | cut -d' ' -f1)"
  if [ -z "$before_deploy" ]; then
    echo "::warning::Could not read the Dokploy deployments, so this run can only time out, after $WAIT_MINUTES minutes, instead of stopping at a failed deploy."
  fi
fi
trigger_deploy "$RELEASE_ID" || exit 1
wait_for_release "$RELEASE_ID" "$before_deploy" && exit 0

if [ -z "$previous" ]; then
  echo "::error::$APP_URL did not report $RELEASE_ID within $WAIT_MINUTES minutes. The $ENVIRONMENT_TAG tag already points at it; run Rollback with the last good commit (or, before Rollback is on main, push a revert) before any Redeploy."
  exit 1
fi

echo "Restoring $previous."
if restore_release "$previous"; then
  echo "::error::Rolled back to $previous; $RELEASE_ID never became healthy."
else
  echo "::error::$RELEASE_ID never became healthy, and rolling back to $previous also failed. Run Rollback with an earlier good commit (or, before Rollback is on main, push a revert) before any Redeploy."
fi
exit 1
