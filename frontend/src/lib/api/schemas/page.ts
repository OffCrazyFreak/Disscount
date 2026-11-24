import { z } from "zod";

export const pageInfoSchema = z.object({
  number: z.number().int(),
  size: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
});

export function pageSchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    page: pageInfoSchema,
  });
}
