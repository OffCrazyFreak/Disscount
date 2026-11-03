// HTTP plumbing for seed-dev-account.mjs: the production guard, better-auth sign-in
// and sign-out, the backend bearer token, and JSON calls through the app's own origin.
import { setTimeout as sleep } from "node:timers/promises";

// The seed must never write to real users' data, whatever the caller passes in.
const PRODUCTION_HOSTS = new Set(["disscount.me", "www.disscount.me"]);

export function readBaseUrl(argv, env) {
  const flagIndex = argv.indexOf("--base-url");
  const raw = flagIndex >= 0 ? argv[flagIndex + 1] : env.NEXT_PUBLIC_APP_URL;
  if (!raw) throw new Error("Pass --base-url or set NEXT_PUBLIC_APP_URL.");

  const url = new URL(raw);
  if (PRODUCTION_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing to seed production (${url.hostname}).`);
  }
  return url.origin;
}

function sessionCookie(response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

// better-auth allows only a few sign-ins per window, and the seed signs in once per device.
async function postWithRetry(url, init) {
  const response = await fetch(url, init);
  if (response.status !== 429) return response;

  const waitSeconds = Number(response.headers.get("x-retry-after")) || 10;
  await sleep((waitSeconds + 1) * 1000);
  return fetch(url, init);
}

export async function signIn(baseUrl, { email, password }, userAgent) {
  const response = await postWithRetry(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
      "user-agent": userAgent,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Sign-in failed with ${response.status}.`);
  }

  const { user } = await response.json();
  return { cookie: sessionCookie(response), userId: user.id };
}

export async function signOut(baseUrl, cookie) {
  await fetch(`${baseUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie, origin: baseUrl, "content-type": "application/json" },
    body: "{}",
  });
}

async function readJson(response, label) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`${label} failed with ${response.status}: ${detail}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/** A caller for the backend (bearer token) and for session-cookie Next routes. */
export async function createApi(baseUrl, cookie) {
  const tokenResponse = await fetch(`${baseUrl}/api/auth/token`, {
    headers: { cookie },
  });
  const { token } = await readJson(tokenResponse, "Token");

  async function call(method, path, body) {
    const isForm = body instanceof FormData;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        cookie,
        origin: baseUrl,
        ...(body && !isForm ? { "content-type": "application/json" } : {}),
      },
      body: body && !isForm ? JSON.stringify(body) : body,
    });
    return readJson(response, `${method} ${path}`);
  }

  return {
    get: (path) => call("GET", path),
    post: (path, body) => call("POST", path, body),
    put: (path, body) => call("PUT", path, body),
    patch: (path, body) => call("PATCH", path, body),
  };
}
