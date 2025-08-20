// Unified API exports
export { default as apiClient } from "@/lib/old/api-base";
export * from "@/lib/old/api-types";

// Specific API modules
export { productsApi, cijeneDevApi } from "./products-api";
export { userApi } from "./user-api";
export { preferencesApi } from "./preferences-api";
export { authService } from "./auth-api";
