import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw-server";
import type { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

vi.mock("server-only", () => ({}));

const { withChainAddresses } =
  await import("@/lib/store-locations/sync/address-source-step");

const PAGE_URL = "https://stridon.hr/hr/distribucija/maloprodaja-4";

const PAGE = `<table>
  <tr><td>NAZIV</td><td>MJESTO</td><td>ULICA</td></tr>
  <tr><td style="height:21px">Prod. 10</td><td>DISKONT V.GORICA</td>
    <td>10410 Velika Gorica</td><td>Ulica Ljudevita Posavskog 23</td></tr>
  <tr><td>Prod. 26</td><td>MARKET PLA&Scaron;KI</td>
    <td>47304 Pla&scaron;ki</td><td>Ulica 143. Domobranske pukovnije b. b.</td></tr>
  <tr><td>Prod. 47</td><td>DISKONT NOVSKA</td>
    <td>44330 Novska</td><td>Trg L. I. Oriovĉanina&#160;10</td></tr>
</table>`;

function target(chain: string, code: string): ISyncTarget {
  return {
    chain,
    code,
    address: "Lj.Posavskog 23",
    city: "V.gorica",
    zipcode: null,
    skipGeoapify: false,
  };
}

describe("withChainAddresses", () => {
  it("gives Stridon targets the address from Stridon's own table", async () => {
    server.use(http.get(PAGE_URL, () => HttpResponse.html(PAGE)));

    const [ten, twentySix, fortySeven, other] = await withChainAddresses(
      [
        target("stridon", "Prod.10"),
        {
          ...target("stridon", "Prod.26"),
          address: "143.Domobranske pukovnije bb",
          city: "Plaški",
        },
        {
          ...target("stridon", "Prod.47"),
          address: "Trg L.I.Oriovčanina",
          city: "Novska",
        },
        target("konzum", "Prod.10"),
      ],
      new AbortController().signal,
    );

    expect(ten.lookup).toEqual({
      address: "Ulica Ljudevita Posavskog 23",
      city: "Velika Gorica",
    });
    expect(ten.address).toBe("Lj.Posavskog 23");
    expect(twentySix.lookup?.city).toBe("Plaški");
    expect(fortySeven.lookup?.address).toBe("Trg L. I. Oriovčanina 10");
    expect(other.lookup).toBeUndefined();
  });

  it("leaves targets as they are when the page changes shape", async () => {
    server.use(http.get(PAGE_URL, () => HttpResponse.html("<p>Novo</p>")));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const targets = [target("stridon", "Prod.10")];

    expect(
      await withChainAddresses(targets, new AbortController().signal),
    ).toEqual(targets);
  });

  it("fetches nothing when no Stridon store needs placing", async () => {
    const targets = [target("konzum", "K1")];

    expect(
      await withChainAddresses(targets, new AbortController().signal),
    ).toEqual(targets);
  });

  it("ignores the chain's address when it names another street or number", async () => {
    server.use(http.get(PAGE_URL, () => HttpResponse.html(PAGE)));

    const [renumbered] = await withChainAddresses(
      [{ ...target("stridon", "Prod.10"), address: "Lj.Posavskog 31" }],
      new AbortController().signal,
    );

    expect(renumbered.lookup).toBeUndefined();
  });

  it("ignores the chain's address when it names another town", async () => {
    server.use(http.get(PAGE_URL, () => HttpResponse.html(PAGE)));

    const [elsewhere] = await withChainAddresses(
      [{ ...target("stridon", "Prod.10"), city: "Novska" }],
      new AbortController().signal,
    );

    expect(elsewhere.lookup).toBeUndefined();
  });

  it("accepts the chain's number at either end of upstream's range", async () => {
    server.use(http.get(PAGE_URL, () => HttpResponse.html(PAGE)));

    const [range] = await withChainAddresses(
      [{ ...target("stridon", "Prod.10"), address: "Lj.Posavskog 21-23" }],
      new AbortController().signal,
    );

    expect(range.lookup?.city).toBe("Velika Gorica");
  });
});
