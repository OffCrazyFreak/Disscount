import axios, { AxiosInstance } from "axios";

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

// Create base axios instance with common configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use((config) => {
  // Only add token in browser environment
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for common error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here if needed
    if (error.response?.status === 401) {
      // Token expired or invalid - could trigger logout here
      console.warn("Unauthorized request - token may be expired");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
