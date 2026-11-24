import { proxyDocsToBackend } from "@/lib/backend-proxy/proxy-to-backend";

// Read-only on purpose: with only GET exported, Next refuses every write with 405.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/swagger-ui/[...path]">,
) {
  return proxyDocsToBackend(request, ["swagger-ui", ...(await params).path]);
}
