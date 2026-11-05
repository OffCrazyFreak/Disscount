import { beforeEach, vi } from "vitest";

/**
 * What this tab's useSession reports; the session cookie on the server differs from it only
 * between a change there and the tab's next poll. Import this file before anything that reaches
 * the mocked modules, so its mocks win. A test file's own vi.mock of one of them would lose.
 */
export const tab = {
  userId: null as string | null,
  sessionId: "session-1",
  error: null as Error | null,
};

beforeEach(() => {
  tab.userId = null;
  tab.sessionId = "session-1";
  tab.error = null;
});

// Only useSession is faked; authClient stays real so MSW answers its requests.
vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: tab.userId
        ? {
            user: { id: tab.userId },
            session: { id: tab.sessionId, userId: tab.userId },
          }
        : null,
      isPending: false,
      error: tab.error,
    }),
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/offline/purge", () => ({ purgeOfflineCache: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
}));
