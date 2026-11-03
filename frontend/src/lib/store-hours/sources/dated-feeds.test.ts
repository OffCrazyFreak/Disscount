import { describe, expect, it, vi } from "vitest";

import { parseKonzumHours } from "@/lib/store-hours/sources/konzum-hours";
import {
  parsePlodineHours,
  plodinePageUrl,
} from "@/lib/store-hours/sources/plodine-hours";
import { parseSparHours } from "@/lib/store-hours/sources/spar-hours";
import {
  parseStudenacList,
  parseStudenacPage,
} from "@/lib/store-hours/sources/studenac-hours";
import {
  parseTrgocentarSundays,
  parseTrgocentarWeek,
} from "@/lib/store-hours/sources/trgocentar-hours";

vi.mock("server-only", () => ({}));

const { parseLidlStore } =
  await import("@/lib/store-hours/sources/lidl-hours-source");

const day = (opens: string, closes: string) => [{ opens, closes }];
const TODAY = "2026-11-04";

describe("dated feeds", () => {
  it("dates Konzum's ten days, closed ones included", () => {
    const entry = (
      name: string,
      date: string | null,
      opens = "07:00",
      closes = "20:00",
    ) => ({
      name,
      from_hour: date && `${date}T${opens}:00`,
      to_hour: date && `${date}T${closes}:00`,
    });
    const hours = parseKonzumHours(
      JSON.stringify([
        entry("Srijeda", null),
        entry("Četvrtak", "2026-11-05"),
        entry("Petak", "2026-11-06"),
        entry("Subota", "2026-11-07"),
        entry("Nedjelja", "2026-11-08", "08:00", "13:00"),
        entry("Ponedjeljak", "2026-11-09"),
        entry("Utorak", "2026-11-10"),
        entry("Srijeda", "2026-11-11"),
      ]),
      TODAY,
    );

    expect(hours?.dated[0]).toEqual({ date: "2026-11-04", ranges: [] });
    expect(hours?.dated[4]).toEqual({
      date: "2026-11-08",
      ranges: day("08:00", "13:00"),
    });
    expect(hours?.weekly[2]).toEqual(day("07:00", "20:00"));
    expect(parseKonzumHours("not json", TODAY)).toBeUndefined();
  });

  it("reads Spar's 0-indexed months and lets a refit close the store", () => {
    const at = (hourOfDay: number) => ({
      year: 1970,
      month: 0,
      dayOfMonth: 1,
      hourOfDay,
      minute: 0,
    });
    const date = (month: number, dayOfMonth: number) => ({
      year: 2026,
      month,
      dayOfMonth,
      hourOfDay: 0,
      minute: 0,
    });
    const hours = parseSparHours(
      {
        shopHours: [
          {
            openingHours: { dayType: "ponedjeljak", from1: at(7), to1: at(21) },
          },
        ],
        specialShopHours: [
          { openingHours: { dayType: date(10, 8), from1: null, to1: null } },
          {
            openingHours: { dayType: date(10, 15), from1: at(8), to1: at(14) },
          },
        ],
        temporarilyClosed: { dateFrom: date(9, 26), dateTo: date(10, 5) },
        pageUrl: "/lokacije/x",
      },
      TODAY,
    );

    expect(hours?.weekly[0]).toEqual(day("07:00", "21:00"));
    expect(hours?.dated).toEqual([
      { date: "2026-11-04", ranges: [] },
      { date: "2026-11-05", ranges: [] },
      { date: "2026-11-08", ranges: [] },
      { date: "2026-11-15", ranges: day("08:00", "14:00") },
    ]);
  });

  it("dates Plodine's Sunday row to the coming Sunday", () => {
    const card = `<h2 class="market__title"><a href="https://www.plodine.hr/supermarketi/129/plodine-beli-manastir">x</a></h2>
<div><span>Ponedjeljak :</span><strong class="">07:00-21:00</strong></div>
<div><span>Nedjelja :</span><strong class="closed">Zatvoreno</strong></div>`;

    expect(parsePlodineHours(card, TODAY)).toEqual({
      weekly: [day("07:00", "21:00"), null, null, null, null, null, []],
      dated: [{ date: "2026-11-08", ranges: [] }],
    });
    expect(plodinePageUrl(card)).toBe(
      "https://www.plodine.hr/supermarketi/129/plodine-beli-manastir",
    );
  });

  it("dates Studenac's week from its header and reads split shifts", () => {
    const page = `<div class="marketsingle__workhours"><h2>Radno vrijeme <small>02.11 - 08.11.2026.</small></h2>
<ul><li> Ponedjeljak: <strong>07:00-13:00<br>16:00-20:30</strong></li>
<li> Nedjelja: <strong class="orange">Zatvoreno</strong></li></ul></div>`;
    const hours = parseStudenacPage(page);

    expect(hours?.weekly[0]).toEqual([
      { opens: "07:00", closes: "13:00" },
      { opens: "16:00", closes: "20:30" },
    ]);
    expect(hours?.dated.at(-1)).toEqual({ date: "2026-11-08", ranges: [] });
    expect(
      parseStudenacList(
        '<li class="marketlisting__item" data-store-id="1376"><h3 class="card__title">Ulica Dragutina Domjanića 55, Adamovec</h3><a href="https://www.studenac.hr/trgovine/1132/t1376-adamovec">',
      ),
    ).toEqual([
      {
        code: "1376",
        address: "Ulica Dragutina Domjanića 55",
        city: "Adamovec",
        pageUrl: "https://www.studenac.hr/trgovine/1132/t1376-adamovec",
      },
    ]);
  });

  it("reads Trgocentar's week and its working Sunday sheet", () => {
    expect(
      parseTrgocentarWeek(
        "<p><strong>RADNO VRIJEME</strong></p><p>Pon-Pet: 07:00 - 12:00 / 17:00 - 19:00</p><p>Ned: 08:00 - 11:00</p>",
      )?.weekly[6],
    ).toEqual(day("08:00", "11:00"));

    const sheet = `<tr><td>Oznaka</td><td>Adresa</td><td>Radno</td><td>01/11/2026</td><td>08/11/2026</td><td>15/11/2026</td></tr>
<tr><td>P-060</td><td>Ul. bana Josipa Jelačića 139, Zaprešić</td><td>8 – 13</td><td>1</td><td>1</td><td> </td></tr>`;

    expect(parseTrgocentarSundays(sheet, TODAY)).toEqual([
      {
        code: "P060",
        address: "Ul. bana Josipa Jelačića 139, Zaprešić",
        dated: [
          { date: "2026-11-08", ranges: day("08:00", "13:00") },
          { date: "2026-11-15", ranges: [] },
        ],
      },
    ]);
  });

  it("reads Lidl's GroceryStore JSON-LD", () => {
    const jsonLd = {
      "@type": "GroceryStore",
      address: {
        streetAddress: "Ulica kralja Tomislava 48",
        addressLocality: "Beli Manastir",
        postalCode: "31300",
      },
      geo: { latitude: 45.7719, longitude: 18.60585 },
      openingHoursSpecification: [
        {
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "08:00",
          closes: "21:00",
        },
      ],
      specialOpeningHoursSpecification: [
        {
          validFrom: "2026-11-15",
          validThrough: "2026-11-15",
          opens: "08:00",
          closes: "18:00",
        },
      ],
    };
    const record = parseLidlStore(
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
      "https://www.lidl.hr/s/hr-HR/trazilica-trgovina/beli-manastir/ulica-kralja-tomislava-48/",
      TODAY,
    );

    expect(record?.hours.weekly[5]).toEqual(day("08:00", "21:00"));
    expect(record?.hours.weekly[6]).toEqual([]);
    expect(record?.hours.dated).toEqual([
      { date: "2026-11-15", ranges: day("08:00", "18:00") },
      { date: "2026-11-08", ranges: [] },
    ]);
  });
});
