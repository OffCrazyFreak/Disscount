import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { readIpLocation } = await import("@/app/[locale]/map/utils/ip-location");

// Node hands header bytes over as latin1, so a UTF-8 city arrives like this.
function asNodeReadsIt(text: string): string {
  return Buffer.from(text, "utf8").toString("latin1");
}

describe("readIpLocation", () => {
  it("reads a Croatian guess and repairs the city's encoding", () => {
    const headers = new Headers({
      "cf-iplatitude": "46.38452",
      "cf-iplongitude": "16.43391",
      "cf-ipcity": asNodeReadsIt("Čakovec"),
    });

    expect(readIpLocation(headers)).toEqual({
      lat: 46.38,
      lon: 16.43,
      city: "Čakovec",
    });
  });

  it("ignores a guess outside Croatia", () => {
    const headers = new Headers({
      "cf-iplatitude": "48.2",
      "cf-iplongitude": "16.37",
    });

    expect(readIpLocation(headers)).toBeNull();
  });

  it("ignores missing or broken coordinates", () => {
    expect(readIpLocation(new Headers())).toBeNull();
    expect(
      readIpLocation(
        new Headers({ "cf-iplatitude": "abc", "cf-iplongitude": "16" }),
      ),
    ).toBeNull();
  });
});
