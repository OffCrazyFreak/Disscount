import { describe, expect, it } from "vitest";

import { createMemberScanner } from "@/lib/store-locations/dgu/gml-scanner";

const encoder = new TextEncoder();

describe("createMemberScanner", () => {
  it("joins a member split across chunks", () => {
    const members: string[] = [];
    const scanner = createMemberScanner((member) => members.push(member));

    scanner.write(encoder.encode("<wfs:member>Šet"));
    scanner.write(encoder.encode("alište</wfs:member>"));
    scanner.end();

    expect(members).toEqual(["<wfs:member>Šetalište</wfs:member>"]);
  });

  it("throws instead of buffering a feed without closing tags", () => {
    const scanner = createMemberScanner(() => {});
    const chunk = encoder.encode("<gml:member>".padEnd(600_000, "x"));

    scanner.write(chunk);

    expect(() => scanner.write(chunk)).toThrow(/GML member over/);
  });
});
