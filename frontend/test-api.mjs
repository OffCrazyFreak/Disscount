#!/usr/bin/env node
/**
 * Simple test script to verify API structure works correctly
 * Run with: node test-api.mjs
 */

import {
  apiClient,
  productsApi,
  userApi,
  preferencesApi,
} from "./src/lib/api-client.ts";

console.log("🧪 Testing unified API structure...\n");

// Test that base client is configured
console.log("✅ Base API client:", {
  baseURL: apiClient.defaults.baseURL,
  headers: apiClient.defaults.headers,
});

// Test that all API modules are available
console.log(
  "✅ Products API:",
  typeof productsApi.searchProducts === "function"
);
console.log("✅ User API:", typeof userApi.getCurrentUser === "function");
console.log(
  "✅ Preferences API:",
  typeof preferencesApi.getCurrentUserPinnedStores === "function"
);

console.log("\n🎉 All API modules loaded successfully!");
console.log("\n📝 Usage examples:");
console.log("```typescript");
console.log(
  'import { productsApi, userApi, preferencesApi } from "@/lib/api-client";'
);
console.log("");
console.log("// Search products");
console.log('const products = await productsApi.searchProducts("coca cola");');
console.log("");
console.log("// Get current user");
console.log("const user = await userApi.getCurrentUser();");
console.log("");
console.log("// Get user preferences");
console.log(
  "const stores = await preferencesApi.getCurrentUserPinnedStores();"
);
console.log("```");
