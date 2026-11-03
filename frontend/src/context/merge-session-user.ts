import { UserDto } from "@/lib/api/types";

interface ISessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Another tab signed in a different account: the session is real, but the profile held
 * here is the previous account's until the new one loads.
 */
export function isProfileOfAnotherAccount(
  user: UserDto | null,
  sessionUser: ISessionUser | undefined,
): boolean {
  return !!user && !!sessionUser && user.id !== sessionUser.id;
}

// Prefer the session's name and email at render, keeping the app profile's other fields.
export function mergeSessionUser(
  user: UserDto | null,
  sessionUser: ISessionUser | undefined,
): UserDto | null {
  if (!user) return null;

  return {
    ...user,
    name: sessionUser?.name ?? user.name ?? null,
    email: sessionUser?.email ?? user.email ?? null,
    image: user.image ?? null,
  };
}
