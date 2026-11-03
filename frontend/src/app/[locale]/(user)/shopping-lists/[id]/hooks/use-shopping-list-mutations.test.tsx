import { act } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { useShoppingListMutations } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";

describe("useShoppingListMutations", () => {
  it("shows the server's translated reason when a delete is refused", async () => {
    server.use(
      http.delete(`*/api/shopping-lists/${LIST_ID}`, () =>
        HttpResponse.json(
          {
            status: 401,
            code: "session_changed",
            title: "Prijavljen je drugi račun. Osvježavamo podatke.",
          },
          { status: 401 },
        ),
      ),
    );
    const { result } = renderHookWithProviders(() =>
      useShoppingListMutations(LIST_ID),
    );

    await act(() => result.current.confirmDelete());

    expect(toast.error).toHaveBeenCalledWith(
      "Prijavljen je drugi račun. Osvježavamo podatke.",
    );
  });
});
