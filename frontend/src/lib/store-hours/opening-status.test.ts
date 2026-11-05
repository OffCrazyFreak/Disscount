import { describe, expect, it } from "vitest";

import type { StoreHoursDto, TimeRangeDto } from "@/lib/api/schemas";
import { openingStatusAt } from "@/lib/store-hours/opening-status";

const VERIFIED = "2026-11-02T06:00:00.000Z";
const day: TimeRangeDto[] = [{ opens: "07:00", closes: "21:00" }];

function hours(overrides: Partial<StoreHoursDto> = {}): StoreHoursDto {
  return {
    weekly: [day, day, day, day, day, day, []],
    dated: [],
    sundays: "dated",
    source: "chain",
    verifiedAt: VERIFIED,
    checkUrl: null,
    ...overrides,
  };
}

const noHolidays = new Set<string>();

// 2026-11-04 is a Wednesday, 2026-11-07 a Saturday, 2026-11-08 a Sunday.
function at(local: string) {
  return new Date(`${local}+01:00`);
}

describe("openingStatusAt", () => {
  it("is open until the day's closing time", () => {
    expect(
      openingStatusAt(hours(), noHolidays, at("2026-11-04T10:00:00")),
    ).toStrictEqual({
      state: "open",
      closesAt: { date: "2026-11-04", time: "21:00" },
      asOf: VERIFIED,
    });
  });

  it("is closing soon in the last hour", () => {
    expect(
      openingStatusAt(hours(), noHolidays, at("2026-11-04T20:15:00")).state,
    ).toBe("closing-soon");
  });

  it("opens later today before the morning opening", () => {
    expect(
      openingStatusAt(hours(), noHolidays, at("2026-11-04T05:30:00")),
    ).toStrictEqual({
      state: "closed",
      opensAt: { date: "2026-11-04", time: "07:00" },
      asOf: VERIFIED,
    });
  });

  it("is opening soon in the hour before it opens", () => {
    expect(
      openingStatusAt(hours(), noHolidays, at("2026-11-04T06:15:00")),
    ).toStrictEqual({
      state: "opening-soon",
      opensAt: { date: "2026-11-04", time: "07:00" },
      asOf: VERIFIED,
    });
  });

  it("opens tomorrow after closing", () => {
    const status = openingStatusAt(
      hours(),
      noHolidays,
      at("2026-11-04T22:00:00"),
    );

    expect(status).toMatchObject({
      state: "closed",
      opensAt: { date: "2026-11-05", time: "07:00" },
    });
  });

  it("reopens after a split shift's break", () => {
    const split = [
      { opens: "07:00", closes: "13:00" },
      { opens: "17:00", closes: "21:00" },
    ];
    const status = openingStatusAt(
      hours({ weekly: [split, split, split, split, split, split, []] }),
      noHolidays,
      at("2026-11-04T14:00:00"),
    );

    expect(status).toMatchObject({
      state: "closed",
      opensAt: { date: "2026-11-04", time: "17:00" },
    });
  });

  it("never reads a Sunday from the weekly template", () => {
    const status = openingStatusAt(
      hours({ weekly: [day, day, day, day, day, day, day] }),
      noHolidays,
      at("2026-11-08T10:00:00"),
    );

    expect(status.state).toBe("unconfirmed");
  });

  it("opens on a working Sunday the chain announced", () => {
    const announced = "2026-11-06T08:00:00.000Z";
    const status = openingStatusAt(
      hours({
        dated: [
          {
            date: "2026-11-08",
            ranges: [{ opens: "08:00", closes: "13:00" }],
            verifiedAt: announced,
          },
        ],
      }),
      noHolidays,
      at("2026-11-08T10:00:00"),
    );

    expect(status).toStrictEqual({
      state: "open",
      closesAt: { date: "2026-11-08", time: "13:00" },
      asOf: announced,
    });
  });

  it("gives no opening time when an unknown Sunday comes first", () => {
    const status = openingStatusAt(
      hours(),
      noHolidays,
      at("2026-11-07T22:00:00"),
    );

    expect(status).toMatchObject({ state: "closed", opensAt: null });
  });

  it("looks past a Sunday the chain says is closed", () => {
    const status = openingStatusAt(
      hours({
        dated: [{ date: "2026-11-08", ranges: [], verifiedAt: VERIFIED }],
      }),
      noHolidays,
      at("2026-11-07T22:00:00"),
    );

    expect(status).toMatchObject({
      state: "closed",
      opensAt: { date: "2026-11-09", time: "07:00" },
    });
  });

  it("is closed on a public holiday", () => {
    const status = openingStatusAt(
      hours({ verifiedAt: "2026-12-20T06:00:00.000Z" }),
      new Set(["2026-12-25", "2026-12-26"]),
      at("2026-12-25T10:00:00"),
    );

    expect(status).toMatchObject({ state: "closed", opensAt: null });
  });

  it("keeps an exempt store's Sunday hours but not its holidays", () => {
    const exempt = hours({
      weekly: [day, day, day, day, day, day, day],
      sundays: "weekly",
    });

    expect(
      openingStatusAt(exempt, noHolidays, at("2026-11-08T10:00:00")).state,
    ).toBe("open");
    expect(
      openingStatusAt(
        exempt,
        new Set(["2026-11-04"]),
        at("2026-11-04T10:00:00"),
      ).state,
    ).toBe("unconfirmed");
  });

  it("carries a late shift past midnight", () => {
    const late = [{ opens: "16:00", closes: "02:00" }];
    const status = openingStatusAt(
      hours({ weekly: [late, late, late, late, late, late, []] }),
      noHolidays,
      at("2026-11-05T01:00:00"),
    );

    expect(status).toMatchObject({
      state: "closing-soon",
      closesAt: { date: "2026-11-05", time: "02:00" },
    });
  });

  it("has no closing time when open around the clock", () => {
    const allDay = [{ opens: "00:00", closes: "24:00" }];
    const status = openingStatusAt(
      hours({ weekly: Array(7).fill(allDay), sundays: "weekly" }),
      noHolidays,
      at("2026-11-04T10:00:00"),
    );

    expect(status).toMatchObject({ state: "open", closesAt: null });
  });

  it.each(["24:00", "00:00"])(
    "closes at the end of today when the day closes at %s",
    (closes) => {
      const toMidnight = [{ opens: "07:00", closes }];
      const status = openingStatusAt(
        hours({ weekly: [day, day, toMidnight, day, day, day, []] }),
        noHolidays,
        at("2026-11-04T20:00:00"),
      );

      expect(status).toMatchObject({
        state: "open",
        closesAt: { date: "2026-11-04", time: "24:00" },
      });
    },
  );

  it("joins a day that closes at 24:00 to one that opens at 00:00", () => {
    const status = openingStatusAt(
      hours({
        weekly: [
          day,
          day,
          [{ opens: "07:00", closes: "24:00" }],
          [{ opens: "00:00", closes: "12:00" }],
          day,
          day,
          [],
        ],
      }),
      noHolidays,
      at("2026-11-04T23:30:00"),
    );

    expect(status).toMatchObject({
      state: "open",
      closesAt: { date: "2026-11-05", time: "12:00" },
    });
  });

  it("is unconfirmed when the source skipped the day", () => {
    const status = openingStatusAt(
      hours({ weekly: [day, day, null, day, day, day, []] }),
      noHolidays,
      at("2026-11-04T10:00:00"),
    );

    expect(status.state).toBe("unconfirmed");
  });

  it("ignores an announcement older than two refreshes", () => {
    const status = openingStatusAt(
      hours({
        dated: [
          {
            date: "2026-11-08",
            ranges: [{ opens: "08:00", closes: "13:00" }],
            verifiedAt: "2026-09-01T06:00:00.000Z",
          },
        ],
      }),
      noHolidays,
      at("2026-11-08T10:00:00"),
    );

    expect(status.state).toBe("unconfirmed");
  });

  it("trusts a fresh announcement over a stale template", () => {
    const status = openingStatusAt(
      hours({
        verifiedAt: "2026-10-20T06:00:00.000Z",
        dated: [
          {
            date: "2026-11-08",
            ranges: [{ opens: "08:00", closes: "13:00" }],
            verifiedAt: "2026-11-06T06:00:00.000Z",
          },
        ],
      }),
      noHolidays,
      at("2026-11-08T10:00:00"),
    );

    expect(status.state).toBe("open");
  });

  it("is unconfirmed once two weekly refreshes were missed", () => {
    const status = openingStatusAt(
      hours({ verifiedAt: "2026-10-20T06:00:00.000Z" }),
      noHolidays,
      at("2026-11-04T10:00:00"),
    );

    expect(status).toStrictEqual({
      state: "unconfirmed",
      asOf: "2026-10-20T06:00:00.000Z",
    });
  });
});
