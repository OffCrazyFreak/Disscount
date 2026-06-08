import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { authClient } from "@/lib/auth-client";

// Prefer a relative path in the browser so Next.js rewrites (defined in next.config.ts)
// can proxy requests to the backend during development and avoid CORS issues.
// On the server (Next.js SSR), fall back to an absolute backend URL if provided or
// to http://localhost:8080 for local development.
const API_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL; // optional (e.g. https://api.example.com)

const API_BASE_URL =
  typeof window !== "undefined"
    ? // run through Next.js proxy in browser
      ""
    : // server-side: use explicit backend URL if set, otherwise default to localhost
      API_PUBLIC_BASE || "http://localhost:8080";

// Create base axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper functions
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Constants for retry policy
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200; // 0.2s

// --- better-auth JWT handling -------------------------------------------------
// The Spring backend is a resource server that validates better-auth JWTs via
// JWKS. We fetch a short-lived JWT from better-auth (cookie-authenticated) and
// attach it as a Bearer token. The token is cached in memory and refreshed on a
// 401 (or after sign-out via clearAuthToken).
let cachedJwt: string | null = null;
// While logged out, every request would otherwise re-hit /api/auth/token (401).
// Once we learn there's no session, back off briefly instead of hammering it.
let noSessionUntil = 0;
const NO_SESSION_BACKOFF_MS = 5000;

async function fetchJwt(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (Date.now() < noSessionUntil) return null;

  try {
    const { data } = await authClient.token();
    cachedJwt = data?.token ?? null;
  } catch {
    cachedJwt = null;
  }

  if (!cachedJwt) {
    noSessionUntil = Date.now() + NO_SESSION_BACKOFF_MS;
  }

  return cachedJwt;
}

async function getJwt(): Promise<string | null> {
  return cachedJwt ?? fetchJwt();
}

// Call on sign-out: drop the token and back off from /api/auth/token.
export function clearAuthToken() {
  cachedJwt = null;
  noSessionUntil = Date.now() + NO_SESSION_BACKOFF_MS;
}

// Call on sign-in: clear the backoff so the next request fetches a token now.
export function resetAuthToken() {
  cachedJwt = null;
  noSessionUntil = 0;
}

// Add request interceptor to include the better-auth JWT
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = await getJwt();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
);

// Add response interceptor for token refresh and retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If no original request context, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized by fetching a fresh JWT and retrying once
    if (
      error.response?.status === 401 &&
      !originalRequest.headers?.["X-Retry-After-Refresh"]
    ) {
      cachedJwt = null;
      const token = await fetchJwt();

      if (token) {
        const newRequestConfig = { ...originalRequest };

        if (newRequestConfig.headers) {
          (newRequestConfig.headers as Record<string, string>).Authorization =
            `Bearer ${token}`;
          (newRequestConfig.headers as Record<string, string>)[
            "X-Retry-After-Refresh"
          ] = "true";
        }

        return apiClient(newRequestConfig);
      }

      // Not authenticated (no token) — surface the 401 to the caller.
      return Promise.reject(error);
    }

    // For other errors, implement retry with linear backoff
    const retryConfig = originalRequest as AxiosRequestConfig & {
      __retryCount?: number;
    };
    retryConfig.__retryCount = retryConfig.__retryCount || 0;

    if (retryConfig.__retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    retryConfig.__retryCount += 1;
    const delayMs = BASE_DELAY_MS * retryConfig.__retryCount;

    try {
      await sleep(delayMs);
      return apiClient(retryConfig);
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  },
);

export default apiClient;
