#!/usr/bin/env bash
# Puts one commit's images live on an environment. On dev, a release that never goes live is
# replaced by the one that was serving before it, and the job still fails.
# Reads RELEASE_ID, ENVIRONMENT_TAG, APP_URL, DOKPLOY_URL, DOKPLOY_API_KEY and COMPOSE_ID.
set -uo pipefail

POLL_SECONDS=15

# The CI key allows 10 requests, and its count only resets after 60 s without one. A denied request
# is a 401 even for the trigger, so Dokploy requests stay further apart than that and the count never fills.
DOKPLOY_GAP_SECONDS=65
last_dokploy_request=-$DOKPLOY_GAP_SECONDS

# Dev: the ceiling for a deploy Dokploy never reports as failed. Healthy deploys took 54 to 74 s,
# and compose gives up on the slowest healthcheck chain at 300 s.
# Only dev has proved the backstop, so prod keeps its long wait and its manual Rollback.
if [ "$ENVIRONMENT_TAG" = dev ]; then
  WAIT_MINUTES=5
else
  WAIT_MINUTES=15
fi

DOKPLOY_URL="${DOKPLOY_URL%/}"
RUN_LABEL="run ${GITHUB_RUN_ID:-local}/${GITHUB_RUN_ATTEMPT:-1}"

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

wait_for_dokploy_gap() {
  local wait=$((last_dokploy_request + DOKPLOY_GAP_SECONDS - SECONDS))
  if [ "$wait" -gt 0 ]; then
    sleep "$wait"
  fi
  last_dokploy_request=$SECONDS
}

# Only the status code is printed, because Dokploy's response bodies can echo service
# settings into a public log. The description is how the wait finds this deploy's own row.
trigger_deploy() {
  local release="$1" title="$2" description="$3" status attempt body

  body="$(jq -nc --arg composeId "$COMPOSE_ID" --arg title "$title" --arg description "$description" \
    '{composeId: $composeId, title: $title, description: $description}')"

  for attempt in 1 2; do
    wait_for_dokploy_gap
    status=$(curl --silent --show-error --max-time 30 --output /dev/null --write-out '%{http_code}' \
      --request POST "$DOKPLOY_URL/api/compose.deploy" \
      --header "x-api-key: $DOKPLOY_API_KEY" \
      --header "Content-Type: application/json" \
      --data "$body" || true)

    # A dev job right behind another can find the key's count full; the window clears it.
    if [ "$status" != 401 ] || [ "$attempt" = 2 ] || [ "$ENVIRONMENT_TAG" != dev ]; then
      break
    fi
    echo "Dokploy answered 401, possibly the rate limit; trying once more in $DOKPLOY_GAP_SECONDS s."
  done

  if [[ "$status" != 2* ]]; then
    echo "::error::Dokploy did not accept the deploy (HTTP $status). The $ENVIRONMENT_TAG tag already points at $release; run Rollback with the last good commit (or, before Rollback is on main, push a revert) before any Redeploy."
    return 1
  fi
}

# Sets deployment_status to the status of the deployment row carrying this description, or to
# nothing when there is no such row yet or the read failed. 401s are not retried: a wrong key and
# a full rate limit both answer 401, and a retry would only fill the count further.
read_deployment_status() {
  local description="$1"

  wait_for_dokploy_gap
  deployment_status="$(curl --silent --fail --max-time 30 --retry 2 --retry-delay 3 --get \
    --header "x-api-key: $DOKPLOY_API_KEY" \
    --data-urlencode "composeId=$COMPOSE_ID" \
    "$DOKPLOY_URL/api/deployment.allByCompose" |
    jq -r --arg description "$description" '
      if type == "array" then
        map(select(.description == $description)) | max_by(.createdAt) | .status // empty
      else
        empty
      end' 2>/dev/null || true)"
}

# compose.deploy only queues the job, and /health stays the proof that the release is live.
# Dokploy's row for this deploy ends the wait early when it reports error or cancelled. When
# needs_row is set, /health already reported the release before the deploy, so success also
# needs the row to reach done. A Dokploy that stops storing descriptions never shows the row;
# then /health alone decides at the deadline, with a warning.
wait_for_deploy() {
  local release="$1" description="$2" needs_row="$3" deadline=$((SECONDS + WAIT_MINUTES * 60))
  local live row_seen="" deployment_status=""

  while [ "$SECONDS" -lt "$deadline" ]; do
    live="$(live_release)"
    if [ "$live" = "$release" ] && [ -z "$needs_row" ]; then
      echo "Live on $release."
      return 0
    fi

    if [ "$((SECONDS - last_dokploy_request))" -ge "$DOKPLOY_GAP_SECONDS" ]; then
      read_deployment_status "$description"
      if [ -n "$deployment_status" ]; then
        row_seen=1
      fi

      case "$deployment_status" in
        error | cancelled)
          echo "Dokploy reports this deploy as $deployment_status after $SECONDS s."
          return 1
          ;;
        done)
          if [ "$(live_release)" = "$release" ]; then
            echo "Dokploy finished this deploy and $release is live."
            return 0
          fi
          ;;
      esac
    fi

    sleep "$POLL_SECONDS"
  done

  if [ -z "$row_seen" ] && [ "$(live_release)" = "$release" ]; then
    echo "::warning::$release is live, but Dokploy never listed a deployment described as \"$description\", so this run cannot prove a new deploy happened. Check that Dokploy still stores the deploy description."
    return 0
  fi

  echo "$release was not live within $WAIT_MINUTES minutes."
  return 1
}

# The restore always needs its own row: a deploy still queued or pulling has not replaced the
# frontend yet, so /health can report the previous release before anything is restored.
restore_release() {
  local release="$1" description="restore $1 $RUN_LABEL"

  move_tag "$release" || return 1
  trigger_deploy "$release" "GitHub $ENVIRONMENT_TAG restore" "$description" || return 1
  wait_for_deploy "$release" "$description" 1
}

if ! [[ "$RELEASE_ID" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::release-id must be a full 40 character commit SHA."
  exit 1
fi

# Checked before any tag moves, so a missing setting never leaves the tag on a commit that was
# never deployed. Only emptiness: a test request cannot tell a wrong key from the rate limit.
missing=""
for setting in DOKPLOY_URL DOKPLOY_API_KEY COMPOSE_ID; do
  if [ -z "${!setting:-}" ]; then
    missing="$missing $setting"
  fi
done
if [ -n "$missing" ]; then
  echo "::error::Empty deploy settings:$missing. Set them on the $ENVIRONMENT_TAG GitHub environment; no tag was moved."
  exit 1
fi

live_before="$(live_release)"
needs_row=""
if [ "$live_before" = "$RELEASE_ID" ]; then
  echo "$RELEASE_ID is already live, so this run waits for Dokploy to finish a fresh deploy of it."
  needs_row=1
fi

previous=""
if [ "$ENVIRONMENT_TAG" = dev ]; then
  if ! [[ "$live_before" =~ ^[0-9a-f]{40}$ ]]; then
    echo "::warning::$APP_URL/health named no release before this deploy, so there is no known good release and the backstop is off for this run."
  elif [ -n "$needs_row" ]; then
    echo "There is no earlier release to go back to."
  else
    previous="$live_before"
    echo "Last good release: $previous."
  fi
fi

description="$RELEASE_ID $RUN_LABEL"
move_tag "$RELEASE_ID" || exit 1
trigger_deploy "$RELEASE_ID" "GitHub $ENVIRONMENT_TAG deploy" "$description" || exit 1
wait_for_deploy "$RELEASE_ID" "$description" "$needs_row" && exit 0

if [ -z "$previous" ]; then
  echo "::error::$APP_URL did not report $RELEASE_ID within $WAIT_MINUTES minutes, or Dokploy reported its deploy as failed. The $ENVIRONMENT_TAG tag already points at it; run Rollback with the last good commit (or, before Rollback is on main, push a revert) before any Redeploy."
  exit 1
fi

echo "Restoring $previous."
if restore_release "$previous"; then
  echo "::error::Rolled back to $previous; $RELEASE_ID never became healthy."
else
  echo "::error::$RELEASE_ID never became healthy, and rolling back to $previous also failed. Run Rollback with an earlier good commit (or, before Rollback is on main, push a revert) before any Redeploy."
fi
exit 1
