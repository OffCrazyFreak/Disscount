import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { authClient } from "@/lib/auth-client";

const API_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL;

const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : API_PUBLIC_BASE || "http://localhost:8080";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// In-memory JWT cache — avoids calling authClient.token() on every request
let cachedToken: string | null = null;

// Backoff timestamp: don't hit /api/auth/token before this time (ms)
let tokenBackoffUntil = 0;

const TOKEN_BACKOFF_MS = 10_000;

async function getToken(): Promise<string | null> {
  if (Date.now() < tokenBackoffUntil) return null;

  if (cachedToken) return cachedToken;

  try {
    const result = await authClient.token();
    const token = result?.data?.token ?? null;
    if (!token) {
      tokenBackoffUntil = Date.now() + TOKEN_BACKOFF_MS;
      return null;
    }
    cachedToken = token;
    return cachedToken;
  } catch {
    tokenBackoffUntil = Date.now() + TOKEN_BACKOFF_MS;
    return null;
  }
}

export function clearAuthToken() {
  cachedToken = null;
  tokenBackoffUntil = Date.now() + TOKEN_BACKOFF_MS;
}

export function resetAuthToken() {
  cachedToken = null;
  tokenBackoffUntil = 0;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined" && config.headers) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    if (
      error.response?.status === 401 &&
      !originalRequest.headers?.["X-Retry-After-Refresh"]
    ) {
      cachedToken = null;
      const freshToken = await getToken();

      if (freshToken && originalRequest.headers) {
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${freshToken}`;
        (originalRequest.headers as Record<string, string>)["X-Retry-After-Refresh"] = "true";
        return apiClient(originalRequest);
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
