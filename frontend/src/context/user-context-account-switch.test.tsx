import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

const { tab } = vi.hoisted(() => ({
  tab: { userId: null as string | null },
}));

vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: tab.userId ? { user: { id: tab.userId } } : null,
      isPending: false,
      error: null,
    }),
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/offline/purge", () => ({ purgeOfflineCache: vi.fn() }));

function profile(id: string) {
  return {
    ...storedUser,
    id,
    username: `name of ${id}`,
    pinnedStores: [],
    pinnedPlaces: [],
  };
}

/** A profile endpoint whose answers the test releases one by one, in any order. */
function holdProfileAnswers() {
  const held: Array<(answer: Response) => void> = [];
  server.use(
    http.get(
      "*/api/users/me",
      () => new Promise<Response>((resolve) => held.push(resolve)),
    ),
  );

  async function requestArrived(index: number) {
    await waitFor(() => expect(held.length).toBeGreaterThan(index));
  }

  return {
    requestArrived,
    async release(index: number, answer: Response) {
      await requestArrived(index);
      await act(async () => {
        held[index](answer);
      });
    },
  };
}

interface IFlags {
  sessionUserId: string | null;
  username: string | null | undefined;
  accountUsername: string | null | undefined;
  isAuthenticated: boolean;
  canShowAccountData: boolean;
  isLoading: boolean;
  isInitializing: boolean;
}

const renders: IFlags[] = [];

function Probe() {
  const {
    user,
    accountUser,
    isAuthenticated,
    canShowAccountData,
    isLoading,
    isInitializing,
  } = useUser();

  renders.push({
    sessionUserId: tab.userId,
    username: user?.username,
    accountUsername: accountUser?.username,
    isAuthenticated,
    canShowAccountData,
    isLoading,
    isInitializing,
  });

  return <p>{user ? user.username : "no profile"}</p>;
}

function tree() {
  return (
    <UserProvider>
      <Probe />
    </UserProvider>
  );
}

function rendersUnder(userId: string) {
  return renders.filter((flags) => flags.sessionUserId === userId);
}

beforeEach(() => {
  tab.userId = null;
  renders.length = 0;
  setCacheIdentity(null);
});

describe("UserProvider while another account's profile loads", () => {
  async function switchFromAToB() {
    const answers = holdProfileAnswers();
    tab.userId = "user-a";
    const view = renderWithProviders(tree());
    await answers.release(0, HttpResponse.json(profile("user-a")));
    await screen.findByText("name of user-a");

    tab.userId = "user-b";
    view.rerender(tree());
    await waitFor(() =>
      expect(rendersUnder("user-b").length).toBeGreaterThan(0),
    );

    return answers;
  }

  it("never shows the previous account's profile under the new session", async () => {
    const answers = await switchFromAToB();
    await answers.release(1, HttpResponse.json(profile("user-b")));
    await screen.findByText("name of user-b");

    const usernames = rendersUnder("user-b").flatMap((flags) => [
      flags.username,
      flags.accountUsername,
    ]);
    expect(usernames).not.toContain("name of user-a");
  });

  it("reads as loading, never as signed out, until the new profile arrives", async () => {
    await switchFromAToB();

    expect(screen.getByText("no profile")).toBeInTheDocument();
    for (const flags of rendersUnder("user-b")) {
      expect(flags).toMatchObject({
        isAuthenticated: true,
        canShowAccountData: true,
        isLoading: true,
        isInitializing: true,
      });
    }
  });

  it("settles on the new account's profile", async () => {
    const answers = await switchFromAToB();
    await answers.release(1, HttpResponse.json(profile("user-b")));
    await screen.findByText("name of user-b");

    expect(renders.at(-1)).toMatchObject({
      isAuthenticated: true,
      isLoading: false,
      isInitializing: false,
    });
  });

  it("falls back to the signed-out state when the new profile fails to load", async () => {
    const answers = await switchFromAToB();
    await answers.release(
      1,
      HttpResponse.json({ code: "boom" }, { status: 500 }),
    );

    await waitFor(() =>
      expect(renders.at(-1)).toMatchObject({
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
      }),
    );
  });
});

describe("UserProvider with an older profile load still running", () => {
  async function bothLoadsRunning() {
    const answers = holdProfileAnswers();
    tab.userId = "user-a";
    const view = renderWithProviders(tree());
    // Release order means nothing unless the requests arrived in a known order.
    await answers.requestArrived(0);
    tab.userId = "user-b";
    view.rerender(tree());
    return answers;
  }

  it("ignores the previous account's profile when it answers last", async () => {
    const answers = await bothLoadsRunning();
    await answers.release(1, HttpResponse.json(profile("user-b")));
    await screen.findByText("name of user-b");

    await answers.release(0, HttpResponse.json(profile("user-a")));

    expect(screen.getByText("name of user-b")).toBeInTheDocument();
    expect(renders.at(-1)).toMatchObject({
      isLoading: false,
      isInitializing: false,
    });
  });

  it("ignores the previous account's failure when it answers last", async () => {
    const answers = await bothLoadsRunning();
    await answers.release(1, HttpResponse.json(profile("user-b")));
    await screen.findByText("name of user-b");

    await answers.release(0, HttpResponse.json({}, { status: 401 }));

    expect(screen.getByText("name of user-b")).toBeInTheDocument();
  });

  it("keeps loading when the previous account's load finishes first", async () => {
    const answers = await bothLoadsRunning();
    await answers.release(0, HttpResponse.json(profile("user-a")));

    expect(screen.getByText("no profile")).toBeInTheDocument();
    expect(renders.at(-1)).toMatchObject({ isLoading: true });
  });
});
