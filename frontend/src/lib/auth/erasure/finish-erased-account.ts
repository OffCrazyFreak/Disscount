import { isAxiosError } from "axios";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";

const GONE_STATUS = 410;

// Shape answered by backend UserProvisioningFilter.
const accountErasedSchema = z.object({
  code: z.literal("account_erased"),
  userId: z.string(),
});

export function erasedAccountId(error: unknown): string | null {
  if (!isAxiosError(error) || error.response?.status !== GONE_STATUS) {
    return null;
  }

  const parsed = accountErasedSchema.safeParse(error.response.data);
  return parsed.success ? parsed.data.userId : null;
}

// The backend erase is idempotent, so running deleteUser again only removes the login that survived.
export async function finishErasedAccountDeletion(
  erasedUserId: string,
): Promise<void> {
  try {
    const { data: session } = await authClient.getSession();
    // A tab can hold a token for an account the shared cookie no longer names; never delete that one.
    if (session?.user.id !== erasedUserId) return;

    const { error } = await authClient.deleteUser();
    // A session past freshAge cannot delete; signing out lets the next fresh sign-in finish it.
    if (error?.code === "SESSION_EXPIRED") await authClient.signOut();
  } catch (error) {
    console.error(
      "Finishing an erased account's deletion failed:",
      error instanceof Error ? error.name : typeof error,
    );
  }
}
