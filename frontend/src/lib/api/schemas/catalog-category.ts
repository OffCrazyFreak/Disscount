import { z } from "zod";

import { pageSchema } from "@/lib/api/schemas/page";

export const catalogDepartmentSchema = z.object({
  slug: z.string(),
  productCount: z.number().int(),
});

export const catalogCategorySchema = z.object({
  slug: z.string(),
  department: z.string(),
  indexable: z.boolean(),
  productCount: z.number().int(),
});

export const catalogCategoriesSchema = z.object({
  departments: z.array(catalogDepartmentSchema),
  categories: z.array(catalogCategorySchema),
});

export const categoryProductSchema = z.object({
  ean: z.string(),
  name: z.string().nullable(),
  brand: z.string().nullable(),
});

export const categoryProductsPageSchema = pageSchema(categoryProductSchema);

export type CatalogCategories = z.infer<typeof catalogCategoriesSchema>;
export type CategoryProduct = z.infer<typeof categoryProductSchema>;
export type CategoryProductsPage = z.infer<typeof categoryProductsPageSchema>;
