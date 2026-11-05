import { act } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSaveDigitalCard } from "@/lib/api/digital-cards/mutation-hooks";
import type { DigitalCardRequest } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

// Signed out: the API client asks for a token first and sends the request without one.
const CARD = {
  id: "8f1c2a4e-1b7d-4c55-9a0e-3f6b2d9c7e10",
  data: {
    cardName: "Konzum",
    cardType: "loyalty",
    storeName: "Konzum",
    codeType: "ean_13",
    codeValue: "3850000000000",
    cardColor: "#ff0000",
  },
} satisfies { id: string; data: DigitalCardRequest };

describe("useSaveDigitalCard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects after five attempts while the server keeps answering 502", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    server.use(
      http.put("*/api/digital-cards/:id", () => {
        attempts += 1;
        return HttpResponse.json(null, { status: 502 });
      }),
    );

    const { result } = renderHookWithProviders(() => useSaveDigitalCard());

    const saving = result.current.mutateAsync(CARD);
    const settled = saving.catch((error: unknown) => error);
    await act(() => vi.advanceTimersByTimeAsync(60_000));

    expect(await settled).toMatchObject({ response: { status: 502 } });
    expect(attempts).toBe(5);
  });
});
