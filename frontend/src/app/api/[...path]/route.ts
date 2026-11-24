import { proxyToBackend } from "@/lib/backend-proxy/proxy-to-backend";

// Static and dynamic routes outrank this catch-all, so api/auth, api/account and api/cijene keep their own handlers.
async function handle(
  request: Request,
  { params }: RouteContext<"/api/[...path]">,
) {
  return proxyToBackend(request, (await params).path);
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
