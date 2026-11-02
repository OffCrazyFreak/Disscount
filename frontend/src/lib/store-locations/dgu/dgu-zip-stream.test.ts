import { zipSync, strToU8 } from "fflate";
import { describe, expect, it, vi } from "vitest";

import { scanZipMembers } from "@/lib/store-locations/dgu/dgu-zip-stream";

const zip = zipSync(
  { "Address.gml": strToU8("<wfs:member>a</wfs:member>") },
  { level: 0 },
);

// Hands over the zip but never closes, like a download still in flight.
function openDownload(cancel: () => void): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(zip);
    },
    cancel,
  });
}

describe("scanZipMembers", () => {
  it("cancels the download when a handler fails partway", async () => {
    const cancel = vi.fn();
    const failingHandler = () => {
      throw new Error("bad member");
    };

    await expect(
      scanZipMembers(
        openDownload(cancel),
        { "Address.gml": failingHandler },
        new AbortController().signal,
      ),
    ).rejects.toThrow("bad member");

    expect(cancel).toHaveBeenCalledOnce();
  });

  it("leaves a finished download alone", async () => {
    const cancel = vi.fn();
    const members: string[] = [];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(zip);
        controller.close();
      },
      cancel,
    });

    await scanZipMembers(
      body,
      { "Address.gml": (member) => members.push(member) },
      new AbortController().signal,
    );

    expect(members).toEqual(["<wfs:member>a</wfs:member>"]);
    expect(cancel).not.toHaveBeenCalled();
  });
});
