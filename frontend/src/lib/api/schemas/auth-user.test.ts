import { describe, expect, it } from "vitest";

import { userDtoSchema } from "@/lib/api/schemas/auth-user";
import { storedUser } from "@/test/stored-user";

describe("userDtoSchema", () => {
  it("accepts a username shorter than the form allows, which the column stores", () => {
    const parsed = userDtoSchema.parse({ ...storedUser, username: "a" });

    expect(parsed.username).toBe("a");
  });

  it("accepts an email the backend stored without a format check", () => {
    const parsed = userDtoSchema.parse({
      ...storedUser,
      email: "ana@localhost",
    });

    expect(parsed.email).toBe("ana@localhost");
  });

  it("rejects a response that drops a key the backend always sends", () => {
    const { lastLoginAt: _omitted, ...withoutKey } = storedUser;

    expect(userDtoSchema.safeParse(withoutKey).success).toBe(false);
  });
});
