"use client";

import { useTranslations } from "next-intl";

// "auth.validation.emailInvalid": a namespace and key, never prose.
const MESSAGE_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/;

/**
 * Schemas carry message keys instead of copy, because they are built once at
 * module load, outside any locale. Anything that is not a known key (a server
 * message, zod's own localised text) is shown as it is.
 */
export function useValidationMessage() {
  const t = useTranslations();

  return function translate(message: string | undefined): string | undefined {
    if (!message || !MESSAGE_KEY.test(message)) return message;

    // A dynamic key cannot satisfy the typed key union, so check it at runtime.
    const key = message as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : message;
  };
}
