import { describe, expect, it } from "vitest";

import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { countSignInMethods } from "@/components/custom/settings/security/sign-in-methods";

const google = { providerId: "google" };
const facebook = { providerId: "facebook" };
const credential = { providerId: "credential" };

describe("countSignInMethods", () => {
  it("counts the password once and ignores the credential account row", () => {
    expect(countSignInMethods([credential, google], true)).toBe(2);
  });

  it.runIf(FACEBOOK_COMING_SOON)(
    "leaves Google as the only method when Facebook is still coming soon",
    () => {
      expect(countSignInMethods([google, facebook], false)).toBe(1);
    },
  );
});
