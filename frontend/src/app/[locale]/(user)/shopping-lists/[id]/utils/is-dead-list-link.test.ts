import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { isDeadListLink } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/is-dead-list-link";

function httpError(status: number) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    // The backend sends RFC 9457 Problem Details, which is where parseProblem reads it.
    data: { status },
  });
}

describe("isDeadListLink", () => {
  it("is dead once the server says the list is gone", () => {
    expect(isDeadListLink(httpError(404))).toBe(true);
  });

  it("is not dead on a failure worth retrying", () => {
    expect(isDeadListLink(httpError(503))).toBe(false);
    expect(isDeadListLink(new AxiosError("Network Error"))).toBe(false);
    expect(isDeadListLink(null)).toBe(false);
  });
});
