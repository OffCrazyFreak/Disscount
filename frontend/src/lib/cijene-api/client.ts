import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { toCijeneApiError } from "@/lib/cijene-api/errors";

const CIJENE_API_URL = process.env.CIJENE_API_URL || "https://api.cijene.dev";
const CIJENE_API_TOKEN = process.env.CIJENE_API_TOKEN;

const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[Cijene API] ${message}`, data || "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`[Cijene API Error] ${message}`, error || "");
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[Cijene API Warning] ${message}`, data || "");
  },
};

interface ICijeneClientOptions {
  /** Prefixes log lines so the three clients stay distinguishable */
  label: string;
  baseUrl: string;
  timeoutMs: number;
  /** Only the v1 API is token protected */
  withAuth?: boolean;
}

/** Builds a client that logs both directions and always fails with a CijeneApiError. */
function createCijeneClient({
  label,
  baseUrl,
  timeoutMs,
  withAuth = false,
}: ICijeneClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: timeoutMs,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Disscount-App/1.0",
    },
  });

  client.interceptors.request.use((config) => {
    if (withAuth && CIJENE_API_TOKEN && config.headers) {
      config.headers.Authorization = `Bearer ${CIJENE_API_TOKEN}`;
    }

    if (process.env.NODE_ENV === "development") {
      logger.info(
        `[${label}] ${config.method?.toUpperCase()} ${config.url}`,
        config.params || config.data,
      );
    }

    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `[${label}] ${response.status} ${response.config.method?.toUpperCase()} ${
            response.config.url
          }`,
        );
      }

      return response;
    },
    (error: AxiosError) => {
      const apiError = toCijeneApiError(error);

      logger.error(
        `[${label}] ${apiError.status} ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
        apiError.message,
      );

      throw apiError;
    },
  );

  return client;
}

export const cijeneApiV1Client = createCijeneClient({
  label: "v1",
  baseUrl: `${CIJENE_API_URL}/v1`,
  timeoutMs: 30000,
  withAuth: true,
});

export const cijeneApiV0Client = createCijeneClient({
  label: "v0",
  baseUrl: `${CIJENE_API_URL}/v0`,
  timeoutMs: 30000,
});

export const cijeneApiHealthClient = createCijeneClient({
  label: "health",
  baseUrl: CIJENE_API_URL,
  timeoutMs: 10000,
});

function validateCijeneConfig(): void {
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
}

if (process.env.NODE_ENV !== "test") {
  validateCijeneConfig();
}
