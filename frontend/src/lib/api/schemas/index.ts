// Schema exports
export * from "./auth-user";
export * from "./digital-card";
export * from "./shopping-list";
export * from "./preferences";
export * from "./notifications";
export * from "./watchlist";
export * from "./external-product";

// Utility schemas
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().int().min(0),
  size: z.number().int().min(1).max(100),
  sort: z.array(z.string()).optional(),
});

export const pageResponseSchema = <T extends z.ZodTypeAny>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    totalElements: z.number(),
    totalPages: z.number(),
    size: z.number(),
    number: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  });

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    status: z.number(),
    statusText: z.string(),
  });

// Utility types
export type Pageable = z.infer<typeof paginationSchema>;
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};
export type ApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
};
