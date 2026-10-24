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

    const [ten, twentySix, other] = await withChainAddresses(
      [
        target("stridon", "Prod.10"),
        target("stridon", "Prod.26"),
        target("konzum", "Prod.10"),
      ],
      new AbortController().signal,
    );

    expect(ten.lookup).toEqual({
      address: "Ulica Ljudevita Posavskog 23",
      city: "Velika Gorica",
      zipcode: "10410",
    });
    expect(ten.address).toBe("Lj.Posavskog 23");
    expect(twentySix.lookup?.city).toBe("Plaški");
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
});
