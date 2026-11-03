import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useReauth } from "@/components/custom/settings/security/hooks/use-reauth";
import { renderHookWithProviders } from "@/test/render";

const requests = vi.hoisted(() => ({
  prove: vi.fn(),
  sendReauthCode: vi.fn(),
}));

vi.mock(
  "@/components/custom/settings/security/reauth/reauth-requests",
  () => requests,
);

const COPY = { title: "t", description: "d", confirmLabel: "c" };

describe("useReauth", () => {
  it("runs the action once and never asks while the session is fresh", async () => {
    const action = vi.fn().mockResolvedValue("done");
    const { result } = renderHookWithProviders(() => useReauth("password"));

    await act(() => result.current.withFreshSession(action, COPY));

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.isOpen).toBe(false);
  });

  it("asks for a proof only when the server wants one, then retries once", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce("needs-proof")
      .mockResolvedValueOnce("done");
    requests.prove.mockResolvedValue(null);
    const { result } = renderHookWithProviders(() => useReauth("password"));

    await act(() => result.current.withFreshSession(action, COPY));
    expect(result.current.isOpen).toBe(true);

    const failure = await act(() =>
      result.current.request!.submit({ password: "pw" }),
    );

    expect(requests.prove).toHaveBeenCalledWith({ password: "pw" });
    expect(action).toHaveBeenCalledTimes(2);
    expect(failure).toBeNull();
  });

  it("keeps the dialog's error and skips the retry when the proof fails", async () => {
    const action = vi.fn().mockResolvedValue("needs-proof");
    requests.prove.mockResolvedValue({ reason: "wrong-password" });
    const { result } = renderHookWithProviders(() => useReauth("password"));

    await act(() => result.current.withFreshSession(action, COPY));
    const failure = await act(() =>
      result.current.request!.submit({ password: "nope" }),
    );

    expect(failure).toEqual({ reason: "wrong-password" });
    expect(action).toHaveBeenCalledOnce();
  });

  it("mails the code as the dialog opens for an account without a password", async () => {
    requests.sendReauthCode.mockResolvedValue({ delivery: "sent" });
    const { result } = renderHookWithProviders(() => useReauth("code"));

    await act(async () => result.current.ask(COPY, vi.fn()));

    expect(requests.sendReauthCode).toHaveBeenCalledOnce();
    expect(result.current.delivery).toBe("sent");
    expect(result.current.resendAt).toBeGreaterThan(Date.now());
  });
});
