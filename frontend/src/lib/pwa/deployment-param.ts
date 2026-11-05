import type { RouteMatchCallback, RuntimeCaching } from "serwist";

// Next appends ?dpl=<deploymentId> to asset URLs once deploymentId is set.
const DEPLOYMENT_PARAM = "dpl";

export const DEPLOYMENT_PARAM_PATTERN = new RegExp(`^${DEPLOYMENT_PARAM}$`);

function withoutDeploymentParam(url: URL): string {
  const copy = new URL(url.href);
  copy.searchParams.delete(DEPLOYMENT_PARAM);
  return copy.href;
}

/** defaultCache's rules end in `$`, so `chunk.js?dpl=...` would miss them; cross-origin must match from the start. */
function matchIgnoringDeploymentParam(pattern: RegExp): RouteMatchCallback {
  return ({ url, sameOrigin }) => {
    const match = pattern.exec(withoutDeploymentParam(url));
    if (!match || (!sameOrigin && match.index !== 0)) return false;

    return match.slice(1);
  };
}

export function ignoreDeploymentParam(
  rules: RuntimeCaching[],
): RuntimeCaching[] {
  return rules.map((rule) =>
    rule.matcher instanceof RegExp
      ? { ...rule, matcher: matchIgnoringDeploymentParam(rule.matcher) }
      : rule,
  );
}
