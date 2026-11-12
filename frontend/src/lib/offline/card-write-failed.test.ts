import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import {
  cardDeleteFailed,
  cardWriteFailed,
} from "@/lib/offline/card-write-failed";
import { httpError } from "@/test/http-error";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

// The proxy translates its own refusal, so the toast shows the title it sent.
const sessionChanged = () =>
  httpError(401, {
    status: 401,
    code: "session_changed",
    title: "Prijavljen je drugi račun. Osvježavamo podatke.",
  });

describe("cardWriteFailed", () => {
  it("says the account changed when the proxy refused the old account's pin", () => {
    cardWriteFailed(sessionChanged(), (key) => key);

    expect(toast.error).toHaveBeenCalledWith(
      "Prijavljen je drugi račun. Osvježavamo podatke.",
    );
  });

  it("ignores a 401 title that is not the proxy's account switch", () => {
    cardWriteFailed(httpError(401, { title: "Prijavi se" }), (key) => key);

    expect(toast.error).toHaveBeenCalledWith("offline.cardSaveFailed");
  });
});

describe("cardDeleteFailed", () => {
  it("says the account changed when the proxy refused the old account's pin", () => {
    cardDeleteFailed(sessionChanged(), (key) => key);

    expect(toast.error).toHaveBeenCalledWith(
      "Prijavljen je drugi račun. Osvježavamo podatke.",
    );
  });

  it("falls back to the generic message", () => {
    cardDeleteFailed(httpError(500), (key) => key);

    expect(toast.error).toHaveBeenCalledWith("offline.cardDeleteFailed");
  });
});
