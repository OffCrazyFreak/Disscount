import { z } from "zod";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

// amount is a string so the input can be emptied and free-typed; refine ranges it.
export const addToListFormSchema = z
  .object({
    shoppingListId: z.string().min(1, "Popis za kupnju je obavezan"),
    customListTitle: z.string(),
    amount: z.string().refine(
      (value) => {
        // Plain-integer string only, so "1.9"/"1e2" are rejected rather than truncated.
        if (!/^\d+$/.test(value)) return false;
        const parsed = Number.parseInt(value, 10);
        return parsed >= 1 && parsed <= MAX_SHOPPING_LIST_ITEM_AMOUNT;
      },
      {
        message: `Količina mora biti između 1 i ${MAX_SHOPPING_LIST_ITEM_AMOUNT}`,
      },
    ),
    isChecked: z.boolean(),
    chainCode: z.string().nullable().optional(),
  })
  // The inline "create a list" branch posts straight to the same endpoint as the
  // dedicated form, so it has to state the same rules. Without them this path
  // created one-character lists, and a title past the column width came back as
  // an unactionable 500 instead of a field error.
  .superRefine((values, context) => {
    if (values.shoppingListId !== "new") return;

    const title = values.customListTitle.trim();

    if (title.length < 3) {
      context.addIssue({
        code: "custom",
        path: ["customListTitle"],
        message: "Upiši naziv s najmanje 3 znaka",
      });
    } else if (title.length > 100) {
      context.addIssue({
        code: "custom",
        path: ["customListTitle"],
        message: "Upiši naziv s najviše 100 znakova",
      });
    }
  });

export type AddToListFormData = z.infer<typeof addToListFormSchema>;

export interface IProductPricing {
  storePrices: Record<string, number>;
  averagePrice: number | null;
  cheapestStore: string | null;
}
