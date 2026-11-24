import "server-only";

import Holidays from "date-holidays";

const calendar = new Holidays("HR");

/** Only `public` ones are days off by law; the library's other kinds are days shops keep. */
export function croatianHolidaysBetween(from: string, to: string): string[] {
  const years = new Set([Number(from.slice(0, 4)), Number(to.slice(0, 4))]);

  return [...years]
    .flatMap((year) => calendar.getHolidays(year))
    .filter((holiday) => holiday.type === "public")
    .map((holiday) => holiday.date.slice(0, 10))
    .filter((day) => day >= from && day <= to);
}
