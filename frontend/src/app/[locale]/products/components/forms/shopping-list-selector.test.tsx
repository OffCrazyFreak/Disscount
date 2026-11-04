import { useEffect } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShoppingListSelector from "@/app/[locale]/products/components/forms/shopping-list-selector";
import { Form } from "@/components/ui/form";
import type { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";
import type { AppLocale } from "@/i18n/locales";
import type { ShoppingListDto } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";

const LIST: ShoppingListDto = {
  id: "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70",
  title: "Tjedna kupnja",
  ownerId: "user-a",
  linkAccess: null,
  myAccess: "OWNER",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

const { formRef } = vi.hoisted(() => ({
  formRef: {
    current: null as
      import("react-hook-form").UseFormReturn<AddToListFormData> | null,
  },
}));

function Harness({ initial }: { initial?: Partial<AddToListFormData> }) {
  const form = useForm<AddToListFormData>({
    defaultValues: {
      shoppingListId: "",
      customListTitle: "",
      amount: "1",
      isChecked: false,
      chainCode: null,
      ...initial,
    },
  });
  useEffect(() => {
    formRef.current = form;
  });

  return (
    <Form {...form}>
      <ShoppingListSelector
        formField={form}
        isLoadingLists={false}
        sortedShoppingLists={[LIST]}
        selectedList={undefined}
        onSelectList={(listId) => form.setValue("shoppingListId", listId)}
      />
    </Form>
  );
}

function getForm() {
  if (!formRef.current) throw new Error("Harness not rendered");

  return formRef.current;
}

beforeEach(() => {
  // cmdk scrolls the active row into view, which jsdom does not implement.
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ShoppingListSelector search", () => {
  it("does not save the search text as the new list title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText(/pretraži/i), "tjedna");
    await user.keyboard("{Escape}");

    expect(getForm().getValues("customListTitle")).toBe("");

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByPlaceholderText(/pretraži/i)).toHaveValue("");
  });

  it("keeps the title only once the create row is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText(/pretraži/i), "tjedna");
    await user.click(await screen.findByRole("option", { name: /Stvori/ }));

    expect(getForm().getValues("shoppingListId")).toBe("new");
    expect(getForm().getValues("customListTitle")).toBe("tjedna");

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByPlaceholderText(/pretraži/i)).toHaveValue("tjedna");
  });

  it("drops a chosen new title when an existing list is picked instead", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Harness
        initial={{ shoppingListId: "new", customListTitle: "tjedna" }}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: /Tjedna kupnja/ }),
    );

    expect(getForm().getValues("shoppingListId")).toBe(LIST.id);
    expect(getForm().getValues("customListTitle")).toBe("");
  });
});

describe("create list row", () => {
  const QUOTES: Record<AppLocale, [string, string]> = {
    hr: ["„", "”"],
    en: ["“", "”"],
    it: ["«", "»"],
    sl: ["»", "«"],
    de: ["„", "“"],
  };

  it.each(Object.keys(QUOTES) as AppLocale[])(
    "keeps the %s quotes next to the title",
    async (locale) => {
      const user = userEvent.setup();
      renderWithProviders(<Harness />, { locale });

      await user.click(screen.getByRole("combobox"));
      await user.keyboard("tjedna");

      const row = await screen.findByRole("option", { name: /tjedna/ });
      const [opening, closing] = QUOTES[locale];

      expect(row).toHaveTextContent(`${opening}tjedna${closing}`);
      // The label must be one child so the quotes stay against the title, because the row's flex gap spaces even text nodes; jsdom only sees this structure.
      const bareText = Array.from(row.childNodes).filter(
        (node) => node.nodeType === Node.TEXT_NODE,
      );

      expect(bareText).toHaveLength(0);
    },
  );
});
