import { proxyDocsToBackend } from "@/lib/backend-proxy/proxy-to-backend";

// Read-only on purpose: Next answers 405 for every other method.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/swagger-ui/[...path]">,
) {
  return proxyDocsToBackend(request, ["swagger-ui", ...(await params).path]);
}
