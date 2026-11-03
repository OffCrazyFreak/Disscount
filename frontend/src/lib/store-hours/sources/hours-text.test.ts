import { describe, expect, it } from "vitest";

import {
  comingSunday,
  parseClockRange,
  parseDayText,
  settleSundays,
  weekFromLabelled,
} from "@/lib/store-hours/sources/hours-text";
import { labelledLines } from "@/lib/store-hours/sources/labelled-lines";

describe("hours text", () => {
  it("reads the clock ranges chains print", () => {
    expect(parseClockRange("07:00 - 21:00")).toEqual({
      opens: "07:00",
      closes: "21:00",
    });
    expect(parseClockRange("7 – 12:30")).toEqual({
      opens: "07:00",
      closes: "12:30",
    });
    expect(parseClockRange("09:00 - 00:00")).toEqual({
      opens: "09:00",
      closes: "00:00",
    });
    expect(parseClockRange("00:00 - 00:00")).toBeNull();
    expect(parseClockRange("25:00 - 26:00")).toBeNull();
  });

  it("reads closed words, split shifts and the word sati", () => {
    expect(parseDayText("NE RADI")).toEqual([]);
    expect(parseDayText("Zatvoreno")).toEqual([]);
    expect(parseDayText("07:00 - 20:00 sati")).toEqual([
      { opens: "07:00", closes: "20:00" },
    ]);
    expect(parseDayText("07:00 - 12:00 / 17:00 - 19:00")).toHaveLength(2);
    expect(parseDayText("po dogovoru")).toBeNull();
  });

  it("builds a week from labels, later lines winning", () => {
    const weekly = weekFromLabelled(
      labelledLines(
        "Pon: 07:00 - 14:00 | Uto-Sub: 07:00 - 20:00 | Sub: 07:00 - 12:00<br>Adresa: Ulica 1<br>PRAZNICI I BLAGDANI NERADNI",
      ),
    );

    expect(weekly[0]).toEqual([{ opens: "07:00", closes: "14:00" }]);
    expect(weekly[4]).toEqual([{ opens: "07:00", closes: "20:00" }]);
    expect(weekly[5]).toEqual([{ opens: "07:00", closes: "12:00" }]);
    expect(weekly[6]).toBeNull();
  });

  it("reads labels without a colon", () => {
    expect(
      labelledLines("PONEDJELJAK 07:00 - 20:00<br /> NEDJELJA NE RADI"),
    ).toEqual([
      ["PONEDJELJAK", "07:00 - 20:00"],
      ["NEDJELJA", "NE RADI"],
    ]);
  });

  it("finds the coming Sunday and closes unlisted ones", () => {
    expect(comingSunday("2026-11-04")).toBe("2026-11-08");
    expect(comingSunday("2026-11-08")).toBe("2026-11-08");
    expect(
      settleSundays([{ date: "2026-11-22", ranges: [] }], "2026-11-04").map(
        (day) => day.date,
      ),
    ).toEqual(["2026-11-22", "2026-11-08", "2026-11-15"]);
    expect(settleSundays([], "2026-11-04")).toEqual([]);
  });
});
