import { describe, expect, it } from "vitest";

import { parseKauflandHours } from "@/lib/store-hours/sources/kaufland-hours";
import { parseKtcHours } from "@/lib/store-hours/sources/ktc-hours";
import { parseRibolaHours } from "@/lib/store-hours/sources/ribola-hours";
import { parseRotoHours } from "@/lib/store-hours/sources/roto-hours";
import { parseStanicHours } from "@/lib/store-hours/sources/stanic-hours";
import { parseEurospinHours } from "@/lib/store-hours/sources/eurospin-hours";
import { parseTommyHours } from "@/lib/store-hours/sources/tommy-hours";

const day = (opens: string, closes: string) => [{ opens, closes }];

describe("weekly feeds", () => {
  it("reads Kaufland's wod and its dated sod", () => {
    const hours = parseKauflandHours(
      [
        "Monday|07:00|22:00",
        "Tuesday|07:00|22:00",
        "Wednesday|07:00|22:00",
        "Thursday|07:00|22:00",
        "Friday|07:00|22:00",
        "Saturday|07:00|22:00",
        "Sunday|00:00|00:00",
      ],
      ["2026-11-08|00:00|00:00", "2026-11-15|08:00|13:00"],
    );

    expect(hours.weekly[0]).toEqual(day("07:00", "22:00"));
    expect(hours.weekly[6]).toEqual([]);
    expect(hours.dated).toEqual([
      { date: "2026-11-08", ranges: [] },
      { date: "2026-11-15", ranges: day("08:00", "13:00") },
    ]);
  });

  it("reads Tommy's workweek block", () => {
    const hours = parseTommyHours({
      workweekSchedule: { start: "06:30", end: "20:30" },
      saturdaySchedule: { start: "06:30", end: "20:30" },
      sundaySchedule: { start: "", end: "" },
    });

    expect(hours?.weekly[4]).toEqual(day("06:30", "20:30"));
    expect(hours?.weekly[6]).toEqual([]);
  });

  it("reads KTC's text, its closed shops and its silent Sunday", () => {
    const hours = parseKtcHours(
      "Pon-pet: 07:00 - 18:00; Subota: 07:00 - 17:00;Ponuda gableca dostupna od 09:00;",
    );

    expect(hours?.weekly[2]).toEqual(day("07:00", "18:00"));
    expect(hours?.weekly[5]).toEqual(day("07:00", "17:00"));
    expect(hours?.weekly[6]).toEqual([]);
    expect(parseKtcHours("TRAJNO ZATVORENO")?.weekly[0]).toEqual([]);
  });

  it("reads Ribola's open_hours, midnight closing included", () => {
    const hours = parseRibolaHours(
      '{"mon":["09:00 - 00:00"],"tue":"0","wed":["06:00 - 21:00"],"thu":["06:00 - 21:00"],"fri":["06:00 - 21:00"],"sat":["06:00 - 21:00"],"sun":"1","sun_label":"(radnim nedjeljama)"}',
    );

    expect(hours?.weekly.slice(0, 2)).toEqual([day("09:00", "00:00"), []]);
    expect(hours?.weekly[6]).toBeNull();
  });

  it("reads Stanić's table by its datetime attributes", () => {
    const hours = parseStanicHours(
      '<table><tr><td>Monday</td><td><span class="wpsl-time-range"><time datetime="06:00">06:00</time> – <time datetime="14:00">14:00</time></span></td></tr><tr><td>Sunday</td><td>Closed</td></tr></table>',
    );

    expect(hours?.weekly[0]).toEqual(day("06:00", "14:00"));
    expect(hours?.weekly[6]).toEqual([]);
    expect(hours?.weekly[1]).toBeNull();
  });

  it("reads Eurospin's timetable", () => {
    const hours = parseEurospinHours(
      "Ulica 29<br>47250, Duga Resa KA<div class='timetables_container'><br>Ponedjeljak: 07:00-21:00<br>četvrtak: 07:30-21:00<br><strong>Nedjelja:</strong> Zatvoreno<br></div>",
    );

    expect(hours?.weekly[0]).toEqual(day("07:00", "21:00"));
    expect(hours?.weekly[3]).toEqual(day("07:30", "21:00"));
    expect(hours?.weekly[6]).toEqual([]);
  });

  it("reads Roto's Sunday-first days and settles its Sunday plan", () => {
    const hours = parseRotoHours(
      {
        radno: [
          { dayOfWeek: 0, workingTime: "09:00 - 13:00" },
          { dayOfWeek: 1, workingTime: "07:30 – 21:00" },
        ],
        nedjelje: ["8.11.2025.", "15.11.2026.", "29.11.2026"],
      },
      "2026-11-04",
    );

    expect(hours?.weekly[0]).toEqual(day("07:30", "21:00"));
    expect(hours?.dated).toEqual([
      { date: "2026-11-15", ranges: day("09:00", "13:00") },
      { date: "2026-11-29", ranges: day("09:00", "13:00") },
      { date: "2026-11-08", ranges: [] },
      { date: "2026-11-22", ranges: [] },
    ]);
  });
});
