import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import fetchAuthToken from "@/lib/auth/token";

const API_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL;

const API_BASE_URL =
  typeof window !== "undefined"
    ? ""
    : API_PUBLIC_BASE || "http://localhost:8080";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// The token's `exp` is decoded so we refresh before expiry, not after a 401.
const TOKEN_REFRESH_SKEW_SECONDS = 30;

// Cooldown after a failed fetch - avoids hammering /api/auth/token when logged out
const RETRY_COOLDOWN_MS = 2_000;

let cachedToken: string | null = null;
let cachedExp: number | null = null;
let cachedSubject: string | null = null;
// Undefined until a session first resolves; null once it resolved to nobody.
let sessionUserId: string | null | undefined;
let inflightTokenPromise: Promise<string | null> | null = null;
let lastFailedAttemptAt = 0;

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function parseTokenClaims(token: string): {
  exp: number | null;
  sub: string | null;
} {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return { exp: null, sub: null };

  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as {
      exp?: number;
      sub?: string;
    };
    return { exp: payload.exp ?? null, sub: payload.sub ?? null };
  } catch {
    return { exp: null, sub: null };
  }
}

// The backend acts as whoever `sub` names, so a token minted before an account switch
// would read and write the previous account's data.
function isCachedTokenForSessionUser(): boolean {
  return sessionUserId === undefined || cachedSubject === sessionUserId;
}

function isCachedTokenFresh(): boolean {
  if (!cachedToken || !cachedExp || !isCachedTokenForSessionUser()) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return cachedExp - TOKEN_REFRESH_SKEW_SECONDS > nowInSeconds;
}

function clearTokenCache() {
  cachedToken = null;
  cachedExp = null;
  cachedSubject = null;
}

async function requestFreshToken(): Promise<string | null> {
  try {
    const token = await fetchAuthToken();

    if (!token) {
      clearTokenCache();
      lastFailedAttemptAt = Date.now();
      return null;
    }

    const claims = parseTokenClaims(token);
    cachedToken = token;
    cachedExp = claims.exp;
    cachedSubject = claims.sub;
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

  // A fetch that began before an account switch can finish after it.
  const token = await inflightTokenPromise;
  return token && isCachedTokenForSessionUser() ? token : null;
}

/** The cached bearer token if it is still fresh, with no network call. */
export function peekFreshAuthToken(): string | null {
  return isCachedTokenFresh() ? cachedToken : null;
}

export function clearAuthToken() {
  clearTokenCache();
  lastFailedAttemptAt = Date.now();
}

export function resetAuthToken() {
  clearTokenCache();
  lastFailedAttemptAt = 0;
}

/** Records whose session is active, so only a token issued to that user is attached. */
export function setAuthTokenUser(userId: string | null | undefined) {
  if (userId === sessionUserId) return;

  sessionUserId = userId;
  // A newly signed-in account can mint its token at once, without the signed-out cooldown.
  if (userId && cachedSubject !== userId) resetAuthToken();
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // The backend localises its error messages from this; <html lang> always
      // matches the page, and server-side calls fall back to the backend's Croatian.
      if (typeof document !== "undefined" && document.documentElement.lang) {
        config.headers["Accept-Language"] = document.documentElement.lang;
      }
    }
    return config;
  },
);

// Only 401 retries here; React Query owns the rest, so backoffs never compete.
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
