import { isAxiosError } from "axios";

import {
  limitReachedProblemSchema,
  type LimitReachedProblem,
} from "@/lib/api/schemas/user-limit";

/** The per-user cap the server refused a create with, or null for any other failure. */
export function limitReachedOf(error: unknown): LimitReachedProblem | null {
  if (!isAxiosError(error)) return null;

  const parsed = limitReachedProblemSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data : null;
}

export function isLimitReached(error: unknown): boolean {
  return limitReachedOf(error) !== null;
}
