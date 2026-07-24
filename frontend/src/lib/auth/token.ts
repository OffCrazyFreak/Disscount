import { authClient } from "@/lib/auth/client";

export default async function fetchAuthToken(): Promise<string | null> {
  const { data } = await authClient.$fetch<{ token: string }>("/token", {
    method: "GET",
  });

  return data?.token ?? null;
}
