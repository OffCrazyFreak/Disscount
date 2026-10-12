import type { Formats } from "next-intl";

export const TIME_ZONE = "Europe/Zagreb";

export const formats = {
  dateTime: {
    date: { day: "2-digit", month: "2-digit", year: "numeric" },
    dateTime: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  },
  number: {
    price: { style: "currency", currency: "EUR" },
  },
} satisfies Formats;
