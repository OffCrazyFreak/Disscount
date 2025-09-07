import axios, { AxiosInstance } from "axios";

// Get environment variables
const CIJENE_API_BASE_URL = process.env.NEXT_PUBLIC_CIJENE_API_URL;
const CIJENE_API_TOKEN = process.env.NEXT_PUBLIC_CIJENE_API_TOKEN;

if (!CIJENE_API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_CIJENE_API_URL environment variable is required"
  );
}

if (!CIJENE_API_TOKEN) {
  throw new Error(
    "NEXT_PUBLIC_CIJENE_API_TOKEN environment variable is required"
  );
}

// Create axios instance for Cijene API v1
const cijeneApiClient: AxiosInstance = axios.create({
  baseURL: `${CIJENE_API_BASE_URL}/v1`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CIJENE_API_TOKEN}`,
  },
  timeout: 10000, // 10 second timeout
});

// Create axios instance for v0 endpoints (archives)
const cijeneApiV0Client: AxiosInstance = axios.create({
  baseURL: `${CIJENE_API_BASE_URL}/v0`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Create axios instance for health endpoint (no version)
const cijeneApiHealthClient: AxiosInstance = axios.create({
  baseURL: CIJENE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // 5 second timeout for health checks
});

// Add request interceptor for logging in development
const addLoggingInterceptor = (client: AxiosInstance, name: string) => {
  if (process.env.NODE_ENV === "development") {
    client.interceptors.request.use((config) => {
      console.log(
        `[Cijene API ${name}] ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    });
  }
};

// Add response interceptor for error handling
const addErrorInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Log errors in development
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[Cijene API Error]",
          error.response?.data || error.message
        );
      }

      // Transform API errors into user-friendly messages
      if (error.response?.status === 401) {
        throw new Error("Neispravna autentifikacija za Cijene API");
      } else if (error.response?.status === 404) {
        throw new Error("Traženi resurs nije pronađen");
      } else if (error.response?.status >= 500) {
        throw new Error("Greška na serveru. Pokušajte ponovo kasnije");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Zahtjev je istekao. Pokušajte ponovo");
      }

      throw error;
    }
  );
};

// Apply interceptors to all clients
addLoggingInterceptor(cijeneApiClient, "v1");
addLoggingInterceptor(cijeneApiV0Client, "v0");
addLoggingInterceptor(cijeneApiHealthClient, "health");

addErrorInterceptor(cijeneApiClient);
addErrorInterceptor(cijeneApiV0Client);
addErrorInterceptor(cijeneApiHealthClient);

export { cijeneApiV0Client, cijeneApiHealthClient, cijeneApiClient };
