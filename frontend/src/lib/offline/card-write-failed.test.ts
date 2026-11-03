import { AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { cardDeleteFailed } from "@/lib/offline/card-write-failed";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function httpError(status: number, data: unknown = {}) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

describe("cardDeleteFailed", () => {
  it("says the account changed when the proxy refused the old account's pin", () => {
    cardDeleteFailed(
      httpError(401, { status: 401, code: "session_changed" }),
      (key) => key,
    );

    expect(toast.error).toHaveBeenCalledWith("offline.sessionChanged");
  });

  it("falls back to the generic message", () => {
    cardDeleteFailed(httpError(500), (key) => key);

    expect(toast.error).toHaveBeenCalledWith("offline.cardDeleteFailed");
  });
});
