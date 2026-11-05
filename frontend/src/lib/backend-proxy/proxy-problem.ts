import { createTranslator } from "next-intl";

import { browserLocale } from "@/i18n/browser-locale";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";
import deErrors from "@/i18n/messages/de/errors.json";
import enErrors from "@/i18n/messages/en/errors.json";
import hrErrors from "@/i18n/messages/hr/errors.json";
import itErrors from "@/i18n/messages/it/errors.json";
import slErrors from "@/i18n/messages/sl/errors.json";
import {
  SESSION_CHANGED,
  type SERVER_REPORTED_PROBLEMS,
} from "@/lib/backend-proxy/proxy-contract";

// The backend and Cijene proxies' own refusals and failures, in the Problem Details shape problem-details.ts reads.
export type ProxyProblemCode =
  | "not_found"
  | "csrf_rejected"
  | typeof SESSION_CHANGED
  | (typeof SERVER_REPORTED_PROBLEMS)[number]
  | "upstream_unavailable"
  | "bad_request"
  | "too_many_requests";

type ProxyTitleKey = keyof typeof hrErrors.proxy;

// Static, so building a refusal stays synchronous; check-i18n keeps every catalog complete.
const ERRORS: Record<AppLocale, typeof hrErrors> = {
  hr: hrErrors,
  en: enErrors,
  it: itErrors,
  sl: slErrors,
  de: deErrors,
};

const PROBLEMS: Record<
  ProxyProblemCode,
  { status: number; titleKey: ProxyTitleKey }
> = {
  not_found: { status: 404, titleKey: "notFound" },
  csrf_rejected: { status: 403, titleKey: "refreshPage" },
  [SESSION_CHANGED]: { status: 401, titleKey: "sessionChanged" },
  auth_unavailable: { status: 503, titleKey: "unavailable" },
  backend_unavailable: { status: 502, titleKey: "unavailable" },
  backend_timeout: { status: 504, titleKey: "unavailable" },
  upstream_unavailable: { status: 502, titleKey: "unavailable" },
  bad_request: { status: 400, titleKey: "badRequest" },
  too_many_requests: { status: 429, titleKey: "tooManyRequests" },
};

/** The client sends <html lang> here, the same header Spring localises its own titles from. */
function requestLocale(request: Request): AppLocale {
  const tags = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((tag) => tag.split(";")[0].trim());
  return browserLocale(tags) ?? DEFAULT_LOCALE;
}

export function proxyProblem(
  code: ProxyProblemCode,
  request: Request,
): Response {
  const { status, titleKey } = PROBLEMS[code];
  const locale = requestLocale(request);
  const t = createTranslator({
    locale,
    messages: { errors: ERRORS[locale] },
    namespace: "errors.proxy",
  });

  return Response.json(
    { status, title: t(titleKey), code },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        "cache-control": "private, no-store",
      },
    },
  );
}
