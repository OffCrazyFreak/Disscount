import { beforeEach, describe, expect, it, vi } from "vitest";

import { sentryDataCollection } from "@/lib/sentry/data-collection";

const { init } = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({
  init,
  replayIntegration: vi.fn(),
  thirdPartyErrorFilterIntegration: vi.fn(),
  addEventProcessor: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

// The client config reads window.location for the reset token before Sentry starts.
vi.mock("@/lib/auth/reset-token-storage", () => ({
  moveResetTokenOutOfUrl: () => false,
}));

const SENTRY_CONFIGS = {
  client: () => import("@/instrumentation-client"),
  server: () => import("../../../sentry.server.config"),
  edge: () => import("../../../sentry.edge.config"),
};

describe("Sentry data collection", () => {
  beforeEach(() => {
    init.mockClear();
    vi.resetModules();
  });

  it.each(Object.entries(SENTRY_CONFIGS))(
    "the %s config sets the shared baseline instead of sendDefaultPii",
    async (_runtime, loadConfig) => {
      await loadConfig();

      expect(init).toHaveBeenCalledOnce();
      const options = init.mock.calls[0][0];
      expect(options.dataCollection).toStrictEqual(sentryDataCollection);
      expect(options).not.toHaveProperty("sendDefaultPii");
    },
  );

  it("keeps the IP address, user details, cookies and bodies out, as the privacy policy says", () => {
    expect(sentryDataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
    });
  });
});
