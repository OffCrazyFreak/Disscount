import { FACEBOOK_COMING_SOON } from "@/constants/auth";

// The server refuses Facebook while it is coming soon, so it cannot count as a way back in.
export function countSignInMethods(
  accounts: { providerId: string }[],
  hasPassword: boolean,
) {
  const usableSocials = accounts.filter(
    ({ providerId }) =>
      providerId !== "credential" &&
      !(providerId === "facebook" && FACEBOOK_COMING_SOON),
  );

  return (hasPassword ? 1 : 0) + usableSocials.length;
}
