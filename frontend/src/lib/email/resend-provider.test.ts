import { createElement } from "react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { ResendProvider } from "@/lib/email/resend-provider";
import { server } from "@/test/msw-server";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

const message = {
  to: "kupac@example.com",
  subject: "Potvrdi email",
  react: createElement("p", null, "Bok"),
  idempotencyKey: "verify-email/token-1",
};

function sendWithProvider() {
  return new ResendProvider("re_test", "Disscount <noreply@example.com>").send(
    message,
  );
}

describe("ResendProvider", () => {
  it("sends the idempotency key and returns the email id", async () => {
    let idempotencyKey: string | null = null;

    server.use(
      http.post(RESEND_EMAILS_URL, ({ request }) => {
        idempotencyKey = request.headers.get("Idempotency-Key");
        return HttpResponse.json({ id: "email-1" });
      }),
    );

    await expect(sendWithProvider()).resolves.toEqual({
      id: "email-1",
      error: null,
    });
    expect(idempotencyKey).toBe("verify-email/token-1");
  });

  it("gives up on a stalled request after ten seconds and reports an error", async () => {
    const timeout = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeout.signal);

    server.use(
      http.post(RESEND_EMAILS_URL, async () => {
        // Fire the timeout only once the request is in flight, so this is a stall, not a pre-aborted call.
        timeout.abort(new DOMException("timed out", "TimeoutError"));
        await delay("infinite");
        return HttpResponse.json({ id: "never" });
      }),
    );

    const { id, error } = await sendWithProvider();
    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(id).toBeNull();
    expect(error).toEqual(expect.any(String));
  });
});
