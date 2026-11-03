import axios, { AxiosInstance } from "axios";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import { refetchSessionIfChanged } from "@/lib/api/session-changed";
import { backendProxyHeaders } from "@/lib/backend-proxy/client-headers";

// The browser calls the same-origin proxy route, which signs the backend token on the server.
const API_BASE_URL = typeof window !== "undefined" ? "" : BACKEND_ORIGIN;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof document === "undefined") return config;

  config.headers.set(backendProxyHeaders());
  // The backend localises its error messages from this; <html lang> always
  // matches the page, and server-side calls fall back to the backend's Croatian.
  if (document.documentElement.lang) {
    config.headers["Accept-Language"] = document.documentElement.lang;
  }
  return config;
});

// No retry here; React Query owns retries, so backoffs never compete.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    refetchSessionIfChanged(error);
    return Promise.reject(error);
  },
);

export default apiClient;
