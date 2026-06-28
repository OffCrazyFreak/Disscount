import { z } from "zod";
import { MAX_SHOPPING_LIST_ITEM_AMOUNT } from "@/constants/shopping-list";

export const addToListFormSchema = z.object({
  shoppingListId: z.string().min(1, "Popis za kupnju je obavezan"),
  amount: z
    .number()
    .int()
    .min(1, "Količina mora biti veća od 0")
    .max(
      MAX_SHOPPING_LIST_ITEM_AMOUNT,
      `Količina ne može biti veća od ${MAX_SHOPPING_LIST_ITEM_AMOUNT}`,
    ),
  isChecked: z.boolean(),
  chainCode: z.string().nullable().optional(),
});

export type AddToListFormData = z.infer<typeof addToListFormSchema>;
