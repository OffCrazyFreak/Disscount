import { UserDto } from "@/lib/api/types";

interface ISessionUser {
  name?: string | null;
  email?: string | null;
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
