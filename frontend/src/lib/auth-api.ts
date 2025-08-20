import axios, { AxiosError, AxiosRequestConfig } from "axios";

// Prefer a relative path in the browser so Next.js rewrites (defined in next.config.ts)
// can proxy requests to the backend during development and avoid CORS issues.
// On the server (Next.js SSR), fall back to an absolute backend URL if provided or
// to http://localhost:8080 for local development.
const API_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL; // optional (e.g. https://api.example.com)
const IS_BROWSER = typeof window !== "undefined";
const API_BASE_URL = IS_BROWSER
  ? // run through Next.js proxy in browser
    ""
  : // server-side: use explicit backend URL if set, otherwise default to localhost
    API_PUBLIC_BASE || "http://localhost:8080";

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  stayLoggedInDays?: number;
  notificationsPush?: boolean;
  notificationsEmail?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    username: string;
    image?: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

const authApi = axios.create({
  baseURL: `${API_BASE_URL ? API_BASE_URL + "/api/auth" : "/api/auth"}`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>("/login", data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>("/register", data);
    return response.data;
  },

  async logout(): Promise<void> {
    await authApi.post("/logout");
  },

  async logoutAll(): Promise<void> {
    await authApi.post("/logout-all");
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>("/refresh");
    return response.data;
  },
};

// Interceptor to add auth token to requests
authApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Retry policy
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 500; // 0.5s

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Interceptor to handle 401 responses and retry other failures with linear backoff
authApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config as AxiosRequestConfig | undefined) || undefined;

    // If no original request context, reject
    if (!originalRequest) return Promise.reject(error);

    // Handle 401 by attempting a refresh once
    if (error.response?.status === 401) {
      //if refresh token exists in http only cookies
      const refreshToken = typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("refreshToken="))
            ?.split("=")[1]
        : undefined;

      if (!refreshToken) {
        // If no refresh token, reject
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await authService.refreshToken();
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", refreshResponse.accessToken);
        }

        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        (originalRequest.headers as Record<string, string>)["Authorization"] = `Bearer ${refreshResponse.accessToken}`;
        return authApi.request(originalRequest as AxiosRequestConfig);
      } catch (refreshError) {
        // Refresh failed: clear stored token and reject
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
        }
        return Promise.reject(refreshError ?? error);
      }
    }

    // For other errors, implement retry with linear backoff: 0.5s, 1.0s, 1.5s, ... up to MAX_RETRIES
    const cfg = originalRequest as AxiosRequestConfig & { __retryCount?: number };
    cfg.__retryCount = cfg.__retryCount || 0;

    if ((cfg.__retryCount ?? 0) >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    cfg.__retryCount = (cfg.__retryCount ?? 0) + 1;
    const delayMs = BASE_DELAY_MS * (cfg.__retryCount ?? 1);
    await sleep(delayMs);

    return authApi.request(cfg as AxiosRequestConfig);
  }
);
