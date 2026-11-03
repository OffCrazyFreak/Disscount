import { describe, expect, it } from "vitest";

import { parseOsmOpeningHours } from "@/lib/store-hours/sources/osm-opening-hours";

const day = [{ opens: "07:00", closes: "21:00" }];

describe("parseOsmOpeningHours", () => {
  it("reads day ranges, single days and off", () => {
    expect(
      parseOsmOpeningHours("Mo-Fr 07:00-21:00; Sa 07:00-14:00; Su off; PH off"),
    ).toStrictEqual([
      day,
      day,
      day,
      day,
      day,
      [{ opens: "07:00", closes: "14:00" }],
      [],
    ]);
  });

  it("covers the whole week and treats unmentioned days as closed", () => {
    expect(parseOsmOpeningHours("Mo-Su 07:00-21:00")).toStrictEqual(
      Array(7).fill(day),
    );
    expect(parseOsmOpeningHours("Mo,We 07:00-21:00")).toStrictEqual([
      day,
      [],
      day,
      [],
      [],
      [],
      [],
    ]);
  });

  it("reads split shifts written with or without spaces", () => {
    expect(parseOsmOpeningHours("Mo-Sa 07:00-13:00, 17:00-20:00")?.[0]).toEqual(
      [
        { opens: "07:00", closes: "13:00" },
        { opens: "17:00", closes: "20:00" },
      ],
    );
  });

  it("lets a later rule replace an earlier one", () => {
    expect(
      parseOsmOpeningHours("Mo-Sa 07:00-21:00; Sa 08:00-13:00")?.[5],
    ).toEqual([{ opens: "08:00", closes: "13:00" }]);
  });

  it("wraps a range across the week's end and reads 24/7", () => {
    expect(parseOsmOpeningHours("Sa-Mo 08:00-12:00")?.[0]).toEqual([
      { opens: "08:00", closes: "12:00" },
    ]);
    expect(parseOsmOpeningHours("24/7")?.[3]).toEqual([
      { opens: "00:00", closes: "24:00" },
    ]);
  });

  it("reads a bare time as every day and skips holidays in a day list", () => {
    expect(parseOsmOpeningHours("07:00-22:00")).toStrictEqual(
      Array(7).fill([{ opens: "07:00", closes: "22:00" }]),
    );
    expect(parseOsmOpeningHours("Mo-Sa 07:00-21:00; Su,PH off")?.[6]).toEqual(
      [],
    );
  });

  it("refuses anything richer than a weekly table", () => {
    expect(parseOsmOpeningHours("Jun-Sep Mo-Su 07:00-22:00")).toBeNull();
    expect(parseOsmOpeningHours('Mo-Sa 07:00-21:00 "ljeti duže"')).toBeNull();
    expect(parseOsmOpeningHours("Mo-Sa 07:00+")).toBeNull();
    expect(parseOsmOpeningHours("PH off")).toBeNull();
    expect(parseOsmOpeningHours("")).toBeNull();
  });
});
