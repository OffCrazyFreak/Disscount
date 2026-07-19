import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { authClient } from "@/lib/auth/client";

const API_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL;

const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : API_PUBLIC_BASE || "http://localhost:8080";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// In-memory JWT cache. The token's `exp` is decoded so we can refresh shortly
// before it expires instead of waiting for a 401 round-trip.
const TOKEN_REFRESH_SKEW_SECONDS = 30;

// Cooldown after a failed fetch - avoids hammering /api/auth/token when logged out
const RETRY_COOLDOWN_MS = 2_000;

let cachedToken: string | null = null;
let cachedExp: number | null = null;
let inflightTokenPromise: Promise<string | null> | null = null;
let lastFailedAttemptAt = 0;

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function parseTokenExp(token: string): number | null {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

function isCachedTokenFresh(): boolean {
  if (!cachedToken || !cachedExp) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return cachedExp - TOKEN_REFRESH_SKEW_SECONDS > nowInSeconds;
}

function clearTokenCache() {
  cachedToken = null;
  cachedExp = null;
}

async function requestFreshToken(): Promise<string | null> {
  try {
    const result = await authClient.token();
    const token = result?.data?.token ?? null;

    if (!token) {
      clearTokenCache();
      lastFailedAttemptAt = Date.now();
      return null;
    }

    cachedToken = token;
    cachedExp = parseTokenExp(token);
    lastFailedAttemptAt = 0;
    return token;
  } catch {
    clearTokenCache();
    lastFailedAttemptAt = Date.now();
    return null;
  }
}

async function getToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (!forceRefresh && isCachedTokenFresh()) return cachedToken;

  if (!forceRefresh && Date.now() - lastFailedAttemptAt < RETRY_COOLDOWN_MS) {
    return null;
  }

  // Dedupe concurrent callers so a burst of requests triggers a single token fetch
  if (!inflightTokenPromise) {
    inflightTokenPromise = requestFreshToken().finally(() => {
      inflightTokenPromise = null;
    });
  }

  return inflightTokenPromise;
}

export function clearAuthToken() {
  clearTokenCache();
  lastFailedAttemptAt = Date.now();
}

export function resetAuthToken() {
  clearTokenCache();
  lastFailedAttemptAt = 0;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.headers) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On a 401, refresh the token once and replay the request. All other failures
// (5xx, network) bubble up so React Query's retry policy owns retries - one
// place, not two competing backoffs.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const alreadyRetried = originalRequest.headers?.["X-Retry-After-Refresh"];
    if (error.response?.status === 401 && !alreadyRetried) {
      const freshToken = await getToken(true);
      if (freshToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        originalRequest.headers["X-Retry-After-Refresh"] = "true";
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
