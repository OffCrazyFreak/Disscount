import { isAxiosError } from "axios";

import { parseProblem } from "@/lib/api/problem-details";
import { authClient } from "@/lib/auth/client";

// Shared with backend UserProvisioningFilter, which answers it with 410.
const ACCOUNT_ERASED_CODE = "account_erased";

const GONE_STATUS = 410;

export function isAccountErased(error: unknown): boolean {
  return (
    isAxiosError(error) &&
    error.response?.status === GONE_STATUS &&
    parseProblem(error)?.code === ACCOUNT_ERASED_CODE
  );
}

// The backend erase is idempotent, so running deleteUser again only removes the login that survived.
export async function finishErasedAccountDeletion(): Promise<void> {
  const { error } = await authClient.deleteUser();
  // A session past freshAge cannot delete; signing out lets the next fresh sign-in finish it.
  if (error) await authClient.signOut();
}
