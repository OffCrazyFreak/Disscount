import { authClient } from "@/lib/auth/client";
import { httpStatusError } from "@/lib/api/http-status-error";

export interface ILinkedAccount {
  providerId: string;
  accountId: string;
}

export async function listLinkedAccounts(): Promise<ILinkedAccount[]> {
  const { data, error } = await authClient.listAccounts();
  if (error || !data) {
    throw httpStatusError("Failed to load accounts", error?.status ?? 500);
  }

  return data.map((a) => ({
    providerId: a.providerId,
    accountId: a.accountId,
  }));
}
