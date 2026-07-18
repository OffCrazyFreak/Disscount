import { z } from "zod";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

// amount is kept as a string so the input can be emptied and free-typed; the
// refine validates the range (and blocks submit while empty/invalid).
export const addToListFormSchema = z.object({
  shoppingListId: z.string().min(1, "Popis za kupnju je obavezan"),
  amount: z.string().refine(
    (value) => {
      const parsed = Number.parseInt(value, 10);
      return (
        Number.isInteger(parsed) &&
        parsed >= 1 &&
        parsed <= MAX_SHOPPING_LIST_ITEM_AMOUNT
      );
    },
    { message: `Količina mora biti između 1 i ${MAX_SHOPPING_LIST_ITEM_AMOUNT}` }
  ),
  isChecked: z.boolean(),
  chainCode: z.string().nullable().optional(),
});

export type AddToListFormData = z.infer<typeof addToListFormSchema>;
