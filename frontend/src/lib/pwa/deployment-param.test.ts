import { NetworkOnly, type RouteMatchCallback } from "serwist";
import { describe, expect, it } from "vitest";

import {
  DEPLOYMENT_PARAM_PATTERN,
  ignoreDeploymentParam,
} from "@/lib/pwa/deployment-param";

const ORIGIN = "https://disscount.me";

function matcherFor(pattern: RegExp) {
  const [rule] = ignoreDeploymentParam([
    { matcher: pattern, handler: new NetworkOnly() },
  ]);
  return rule.matcher as RouteMatchCallback;
}

function matches(pattern: RegExp, href: string) {
  const url = new URL(href);
  return Boolean(
    matcherFor(pattern)({
      url,
      sameOrigin: url.origin === ORIGIN,
      request: new Request(href),
      event: {} as never,
    }),
  );
}

describe("ignoreDeploymentParam", () => {
  it("matches an anchored asset rule despite the dpl parameter", () => {
    const staticJs = /\/_next\/static.+\.js$/i;

    expect(staticJs.test(`${ORIGIN}/_next/static/chunks/a.js?dpl=abc`)).toBe(
      false,
    );
    expect(
      matches(staticJs, `${ORIGIN}/_next/static/chunks/a.js?dpl=abc`),
    ).toBe(true);
  });

  it("keeps other parameters in the matched URL", () => {
    expect(
      matches(
        /\/_next\/image\?url=.+$/i,
        `${ORIGIN}/_next/image?url=x&dpl=abc`,
      ),
    ).toBe(true);
  });

  it("still needs a cross-origin URL to match from its start", () => {
    expect(
      matches(/\.(?:js)$/i, "https://cdn.example.com/lib.js?dpl=abc"),
    ).toBe(false);
    expect(
      matches(
        /^https:\/\/fonts\.gstatic\.com\/.*/i,
        "https://fonts.gstatic.com/a.woff2",
      ),
    ).toBe(true);
  });

  it("leaves function matchers alone", () => {
    const matcher: RouteMatchCallback = () => true;
    const [rule] = ignoreDeploymentParam([
      { matcher, handler: new NetworkOnly() },
    ]);

    expect(rule.matcher).toBe(matcher);
  });

  it("names the parameter the precache must ignore", () => {
    expect(DEPLOYMENT_PARAM_PATTERN.test("dpl")).toBe(true);
    expect(DEPLOYMENT_PARAM_PATTERN.test("dplx")).toBe(false);
  });
});
