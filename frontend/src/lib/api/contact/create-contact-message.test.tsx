import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import contactService from "@/lib/api/contact";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

// Signed out: the API client asks for a token first and sends the request without one.
const signedOut = http.get("*/api/auth/token", () =>
  HttpResponse.json(null, { status: 401 }),
);

const submission = {
  subject: "Pitanje",
  message: "Kada se osvježavaju cijene?",
};

const storedMessage = {
  id: "3e7a1c5b-9d2f-4b6a-8c1e-0f4d2a6b8c90",
  userId: null,
  email: null,
  fullName: null,
  subject: "Pitanje",
  message: "Kada se osvježavaju cijene?",
  sourcePath: null,
  readAt: null,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
  deletedAt: null,
};

describe("useCreateContactMessage", () => {
  it("treats a 204 with no body as success", async () => {
    server.use(
      signedOut,
      http.post("*/api/contact", () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHookWithProviders(() =>
      contactService.useCreateContactMessage(),
    );

    await act(() => result.current.mutateAsync(submission));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("parses the stored message from a 200 body", async () => {
    server.use(
      signedOut,
      http.post("*/api/contact", () => HttpResponse.json(storedMessage)),
    );

    const { result } = renderHookWithProviders(() =>
      contactService.useCreateContactMessage(),
    );

    await act(() => result.current.mutateAsync(submission));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(storedMessage);
  });

  it("fails on a 200 body that does not match the schema", async () => {
    server.use(
      signedOut,
      http.post("*/api/contact", () => HttpResponse.json({ id: "x" })),
    );

    const { result } = renderHookWithProviders(() =>
      contactService.useCreateContactMessage(),
    );

    await expect(
      act(() => result.current.mutateAsync(submission)),
    ).rejects.toThrow();
  });
});
