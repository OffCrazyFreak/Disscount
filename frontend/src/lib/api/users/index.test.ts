import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import userService from "@/lib/api/users";
import { server } from "@/test/msw-server";
import { storedUser } from "@/test/stored-user";

const { accountType: _omitted, ...driftedUser } = storedUser;

function serveProfile(body: object) {
  server.use(http.get("*/api/users/me", () => HttpResponse.json(body)));
}

describe("userService.getCurrentUser", () => {
  it("rejects a profile missing a key the backend always sends", async () => {
    serveProfile(driftedUser);

    await expect(userService.getCurrentUser()).rejects.toBeInstanceOf(ZodError);
  });
});
