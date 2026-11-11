import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { deleteErasedIdentity } from "@/lib/auth/delete-erased-identity";
import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import { proxyToBackend } from "@/lib/backend-proxy/proxy-to-backend";

type IAdminUserRouteContext = RouteContext<"/api/admin/users/[userId]">;

const userIdSchema = z.uuid();

async function forwardToBackend(
  request: Request,
  { params }: IAdminUserRouteContext,
): Promise<Response> {
  const { userId } = await params;

  return proxyToBackend(request, ["admin", "users", userId]);
}

// Shadows the catch-all, so no browser call can erase a user's data in Spring and leave their login behind.
export async function DELETE(
  request: Request,
  context: IAdminUserRouteContext,
): Promise<Response> {
  const { userId } = await context.params;
  if (!userIdSchema.safeParse(userId).success) {
    return proxyProblem("bad_request", request);
  }

  const erased = await forwardToBackend(request, context);
  // A refusal or a failure: the identity stays, and Spring's erase is idempotent, so the admin can simply retry.
  if (!erased.ok) return erased;

  try {
    await deleteErasedIdentity(userId);
  } catch (error) {
    // The data is gone but the login is not; repeating the delete, or the user's next visit (410), finishes it.
    Sentry.captureException(error, {
      tags: { flow: "admin-user-delete" },
      extra: { targetUserId: userId },
    });
    void erased.body?.cancel();
    return proxyProblem("auth_unavailable", request);
  }

  return erased;
}

// This file owns the whole path, so the account type change has to pass through it explicitly.
export const PATCH = forwardToBackend;
