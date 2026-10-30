import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));

const { ntlLocator } =
  await import("@/lib/store-locations/sources/ntl-locator");

function page(locations: unknown[]) {
  return `<script>var locations = ${JSON.stringify(locations)};</script>`;
}

function store(title: string, lat: number, lng: number, street = "Ulica 1") {
  return {
    title,
    street,
    place: "31000 Osijek",
    position: { lat, lng },
  };
}

async function storesFrom(locations: unknown[]) {
  server.use(
    http.get("https://ntl.hr/prodajna-mjesta", () =>
      HttpResponse.html(page(locations)),
    ),
  );

  return ntlLocator.fetchStores(new AbortController().signal);
}

describe("ntlLocator", () => {
  it("reads three and four digit store numbers as a code suffix", async () => {
    const stores = await storesFrom([
      store("NTL TRGOVINA BR. 350", 45.15, 18.02),
      store("NTL TRGOVINA BR. 2044", 46.2, 16.04),
      store("NTL TRGOVINA BR. 33", 45.77, 17.69),
      store("NTL REVITA 42", 45.52, 18.57),
    ]);

    expect(stores.map((one) => one.codeSuffix)).toEqual([
      "0350",
      "2044",
      undefined,
      undefined,
    ]);
  });

  it("skips a store ntl.hr pins in the wrong town, until the point changes", async () => {
    const stores = await storesFrom([
      store("NTL CRET", 46.0978, 15.838),
      store("NTL TERA", 45.41, 18.6),
    ]);

    expect(stores).toHaveLength(1);
    expect(stores[0].lat).toBe(45.41);
  });

  it("marks a point for an address without a house number as approximate", async () => {
    const stores = await storesFrom([
      store("NTL REVITA 2", 45.55, 18.71, "Srijemska ul. 0"),
      store("NTL TRGOVINA BR. 2044", 46.2, 16.04, "Hrvatskih Pavlina BB"),
      store("NTL ROKO", 45.56, 18.63, "Josipa Jurja Strossmayera 75"),
      store("NTL BR. 999", 45.57, 18.64, "Ulica 1. svibnja bb"),
    ]);

    expect(stores.map((one) => one.approximate)).toEqual([
      true,
      true,
      false,
      true,
    ]);
  });
});
