/**
 * Lets a same-origin route localise its own errors. <html lang> always matches the page,
 * unlike the browser's Accept-Language; server-side calls send none and get the default.
 */
export function pageLanguageHeaders(): Record<string, string> {
  if (typeof document === "undefined" || !document.documentElement.lang) {
    return {};
  }

  return { "Accept-Language": document.documentElement.lang };
}
