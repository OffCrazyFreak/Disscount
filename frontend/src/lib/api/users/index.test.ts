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

describe("userService avatar uploads", () => {
  it("sends the avatar Blob as the multipart part file", async () => {
    let part: FormDataEntryValue | null = null;
    server.use(
      http.put("*/api/users/me/avatar", async ({ request }) => {
        part = (await request.formData()).get("file");
        return HttpResponse.json({
          ...storedUser,
          image: "https://images.test/a.webp",
        });
      }),
    );

    const user = await userService.uploadAvatar(
      new Blob(["x"], { type: "image/webp" }),
    );

    expect(part).toBeInstanceOf(Blob);
    expect(user.image).toBe("https://images.test/a.webp");
  });
});
