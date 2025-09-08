import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

// Environment variables
const CIJENE_API_URL = process.env.CIJENE_API_URL || "https://api.cijene.dev";
const CIJENE_API_TOKEN = process.env.CIJENE_API_TOKEN;

// Logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Cijene API] ${message}`, data || "");
  },
  error: (message: string, error?: any) => {
    console.error(`[Cijene API Error] ${message}`, error || "");
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Cijene API Warning] ${message}`, data || "");
  },
};

// Custom error class for better error handling
export class CijeneApiError extends Error {
  constructor(public status: number, message: string, public response?: any) {
    super(message);
    this.name = "CijeneApiError";
  }
}

// Create Axios instance for Cijene API v1
const createCijeneV1Client = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${CIJENE_API_URL}/v1`,
    timeout: 30000, // 30 seconds timeout
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Disscount-App/1.0",
    },
  });

  // Request interceptor - add auth token and logging
  client.interceptors.request.use(
    (config) => {
      // Add authorization header if token is available
      if (CIJENE_API_TOKEN && config.headers) {
        config.headers.Authorization = `Bearer ${CIJENE_API_TOKEN}`;
      }

      // Log outgoing requests (only in development)
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `${config.method?.toUpperCase()} ${config.url}`,
          config.params || config.data
        );
      }

      return config;
    },
    (error) => {
      logger.error("Request configuration error", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors and logging
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful responses (only in development)
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `${response.status} ${response.config.method?.toUpperCase()} ${
            response.config.url
          }`,
          {
            duration: response.headers["x-response-time"] || "unknown",
            size: JSON.stringify(response.data).length,
          }
        );
      }

      return response;
    },
    (error: AxiosError) => {
      const { config, response } = error;

      // Create structured error information
      const errorInfo = {
        url: config?.url,
        method: config?.method?.toUpperCase(),
        status: response?.status,
        message: response?.data || error.message,
        timestamp: new Date().toISOString(),
      };

      // Log error with context
      logger.error(
        `API Error: ${errorInfo.method} ${errorInfo.url} - ${errorInfo.status}`,
        errorInfo
      );

      // Transform error based on status code
      if (response) {
        const status = response.status;
        let message = "An error occurred";

        switch (status) {
          case 400:
            message = "Invalid request parameters";
            break;
          case 401:
            message = "Authentication failed - Invalid API token";
            break;
          case 403:
            message = "Access forbidden - Insufficient permissions";
            break;
          case 404:
            message = "Resource not found";
            break;
          case 429:
            message = "Rate limit exceeded - Please try again later";
            break;
          case 500:
            message = "Internal server error";
            break;
          case 502:
          case 503:
          case 504:
            message = "Service temporarily unavailable";
            break;
          default:
            message = `Request failed with status ${status}`;
        }

        throw new CijeneApiError(status, message, response.data);
      }

      // Network errors or timeouts
      if (error.code === "ECONNABORTED") {
        throw new CijeneApiError(408, "Request timeout", null);
      }

      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new CijeneApiError(503, "Service unavailable", null);
      }

      // Generic network error
      throw new CijeneApiError(0, error.message || "Network error", null);
    }
  );

  return client;
};

// Create Axios instance for Cijene API v0 (archives)
const createCijeneV0Client = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${CIJENE_API_URL}/v0`,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Disscount-App/1.0",
    },
  });

  // Add same interceptors as v1 client
  client.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `[v0] ${config.method?.toUpperCase()} ${config.url}`,
          config.params || config.data
        );
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `[v0] ${response.status} ${response.config.method?.toUpperCase()} ${
            response.config.url
          }`
        );
      }
      return response;
    },
    (error) => {
      logger.error(`[v0] API Error`, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return client;
};

// Create Axios instance for health endpoint
const createCijeneHealthClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: CIJENE_API_URL,
    timeout: 10000, // Shorter timeout for health checks
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Disscount-App/1.0",
    },
  });

  // Minimal interceptors for health checks
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      logger.error("Health check failed", error.message);
      return Promise.reject(error);
    }
  );

  return client;
};

// Export configured clients
export const cijeneApiV1Client = createCijeneV1Client();
export const cijeneApiV0Client = createCijeneV0Client();
export const cijeneApiHealthClient = createCijeneHealthClient();

// Configuration validation utility
export const validateCijeneConfig = (): void => {
  if (!CIJENE_API_URL) {
    throw new Error("CIJENE_API_URL environment variable is required");
  }

  if (!CIJENE_API_TOKEN) {
    logger.warn("CIJENE_API_TOKEN not set - some endpoints may fail");
  }

  logger.info("Cijene API configuration", {
    url: CIJENE_API_URL,
    hasToken: !!CIJENE_API_TOKEN,
    environment: process.env.NODE_ENV,
  });
};

// Initialize configuration check
if (process.env.NODE_ENV !== "test") {
  validateCijeneConfig();
}
