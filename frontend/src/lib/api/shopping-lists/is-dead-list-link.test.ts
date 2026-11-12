import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { isDeadListLink } from "@/lib/api/shopping-lists/is-dead-list-link";
import { httpError } from "@/test/http-error";

describe("isDeadListLink", () => {
  it("is dead once the server says the list is gone", () => {
    expect(isDeadListLink(httpError(404))).toBe(true);
  });

  it("is not dead on a failure worth retrying", () => {
    expect(isDeadListLink(httpError(503))).toBe(false);
    expect(isDeadListLink(new AxiosError("Network Error"))).toBe(false);
    expect(isDeadListLink(null)).toBe(false);
  });

  it("is not dead on a proxy 404 page, which a redeploy serves for a moment", () => {
    expect(isDeadListLink(httpError(404, "404 page not found"))).toBe(false);
  });
});
