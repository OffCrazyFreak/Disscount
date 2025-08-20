import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

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
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 500; // 0.5s

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Add response interceptor for token refresh and retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If no original request context, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized by attempting token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest.headers?.["X-Retry-After-Refresh"]
    ) {
      try {
        // Call the refresh token endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            withCredentials: true, // Important to include cookies
          }
        );

        if (response.data && response.data.accessToken) {
          // Store the new access token
          localStorage.setItem("accessToken", response.data.accessToken);

          // Create a new request with the same config but new headers
          const newRequestConfig = { ...originalRequest };

          // Set the new authorization header
          if (newRequestConfig.headers) {
            (
              newRequestConfig.headers as any
            ).Authorization = `Bearer ${response.data.accessToken}`;
            (newRequestConfig.headers as any)["X-Retry-After-Refresh"] = "true";
          }

          return apiClient(newRequestConfig);
        }
      } catch (refreshError) {
        // If refresh fails, clear token and reject
        localStorage.removeItem("accessToken");

        // You might want to redirect to login page or dispatch logout action here
        return Promise.reject(refreshError);
      }
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
  }
);

export default apiClient;
