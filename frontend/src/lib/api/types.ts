// Import all types from schemas (Zod is now source of truth)
export * from "./schemas";

// Auth response type (not covered by requests/DTOs)
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: import("./schemas").UserDto;
}
