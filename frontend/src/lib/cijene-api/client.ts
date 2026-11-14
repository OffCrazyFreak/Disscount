import "server-only";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { toCijeneApiError } from "@/lib/cijene-api/errors";
import { serverEnv } from "@/lib/server-env";

const CIJENE_API_URL = serverEnv.CIJENE_API_URL;
const CIJENE_API_TOKEN = serverEnv.CIJENE_API_TOKEN;

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
  token?: string;
}

function createCijeneClient({
  label,
  baseUrl,
  timeoutMs,
  token,
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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      if (axios.isCancel(error)) throw error;

      const apiError = toCijeneApiError(error);

      logger.error(
        `[${label}] ${apiError.status} ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
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
  token: CIJENE_API_TOKEN,
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

export const cijeneLatestClient = serverEnv.CIJENE_LATEST_API_URL
  ? createCijeneClient({
      label: "latest",
      baseUrl: `${serverEnv.CIJENE_LATEST_API_URL}/v1`,
      timeoutMs: 30000,
      token: serverEnv.CIJENE_LATEST_API_TOKEN,
    })
  : undefined;
