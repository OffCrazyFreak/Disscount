// Re-export unified API structure
export { default as apiClient } from "@/lib/old/api-base";
export * from "@/lib/old/api-types";
export { productsApi, cijeneDevApi } from "./products-api";
export { userApi } from "./user-api";
export { preferencesApi } from "./preferences-api";
