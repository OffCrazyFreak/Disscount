import { parseServerDate } from "@/utils/date";
import { formatLocale, TIME_ZONE } from "@/i18n/formatting";

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, body: string) => {
    if (body[0] !== "#") return ENTITIES[body] ?? whole;

    const code =
      body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);

    // fromCodePoint throws past Unicode's last code point, which would fail a whole feed.
    return code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

export function normalizeForSearch(s: string) {
  if (!s) return "";
  return (
    s
      .normalize("NFD")
      // Not redundant: each strip removes marks the other misses (^ and ` versus U+0363 to U+036F).
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[\u0300-\u036f]/g, "")
      // đ, Đ and ß have no NFD decomposition, so the strips above leave them.
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/ß/g, "ss")
      .toLowerCase()
  );
}

type DateShape = "date" | "dateTime" | "dayMonth";

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(locale: string, shape: DateShape) {
  const key = `${locale}:${shape}`;
  let formatter = dateFormatters.get(key);

  if (!formatter) {
    // 12/10/2026 means two different days to British and American readers, so English spells the month out.
    const spelledMonth = locale === "en";
    formatter = new Intl.DateTimeFormat(formatLocale(locale), {
      day: spelledMonth ? "numeric" : "2-digit",
      month: spelledMonth ? "short" : "2-digit",
      ...(shape !== "dayMonth" && { year: "numeric" }),
      ...(shape === "dateTime" && { hour: "2-digit", minute: "2-digit" }),
      timeZone: TIME_ZONE,
    });
    dateFormatters.set(key, formatter);
  }

  return formatter;
}

// Owner's choice over both CLDR (03. 11. 2026.) and pravopis.hr (3. 11. 2026.): 03.11.2026.
function withoutSpacesInCroatianDate(parts: Intl.DateTimeFormatPart[]) {
  return parts
    .map((part, index) => {
      const previous = parts[index - 1]?.type;
      const followsDayOrMonth = previous === "day" || previous === "month";

      return part.type === "literal" && followsDayOrMonth
        ? part.value.trim()
        : part.value;
    })
    .join("");
}

function formatServerDate(
  dateString: string | null | undefined,
  locale: string,
  shape: DateShape,
) {
  if (!dateString) return "";

  const d = parseServerDate(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  const formatter = dateFormatter(locale, shape);

  return formatLocale(locale) === "hr-HR"
    ? withoutSpacesInCroatianDate(formatter.formatToParts(d))
    : formatter.format(d);
}

/** Falls back to the original input when the date is invalid. */
export function formatDate(
  dateString: string | null | undefined,
  locale: string,
) {
  return formatServerDate(dateString, locale, "date");
}

export function formatDateTime(
  dateString: string | null | undefined,
  locale: string,
) {
  return formatServerDate(dateString, locale, "dateTime");
}

export function formatDayMonth(
  dateString: string | null | undefined,
  locale: string,
) {
  return formatServerDate(dateString, locale, "dayMonth");
}

export function formatQuantity(q?: string | null): string | null {
  if (q == null) return null;
  if (q.includes(".")) {
    let trimmed = q.replace(/0+$/g, "");
    if (trimmed.endsWith(".")) trimmed = trimmed.slice(0, -1);
    return trimmed;
  }
  return q;
}

/** Č, Ć, Đ, Š and Ž have their own alphabet places; use this for every user-facing sort so lists agree. */
export function compareHr(a: string, b: string): number {
  return a.localeCompare(b, "hr", { sensitivity: "base" });
}
