import { z } from "zod";

export const addToListFormSchema = z.object({
  shoppingListId: z.string().min(1, "Lista je obavezna"),
  shoppingListTitle: z.string().optional(),
  amount: z.number().int().min(1, "Količina mora biti veća od 0"),
  isChecked: z.boolean(),
});

export type AddToListFormData = z.infer<typeof addToListFormSchema>;
