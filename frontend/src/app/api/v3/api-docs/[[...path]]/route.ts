import { proxyDocsToBackend } from "@/lib/backend-proxy/proxy-to-backend";

// Read-only on purpose: Next answers 405 for every other method.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/v3/api-docs/[[...path]]">,
) {
  const { path = [] } = await params;
  return proxyDocsToBackend(request, ["v3", "api-docs", ...path]);
}
