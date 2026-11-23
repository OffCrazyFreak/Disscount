import { serverEnv } from "@/lib/server-env";

/** Reached through the `/<key>.txt` rewrite in next.config.ts; any other name is a 404. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/indexnow-key/[key]">,
): Promise<Response> {
  const { key } = await params;
  const indexNowKey = serverEnv.INDEXNOW_KEY;

  if (!indexNowKey || key !== indexNowKey) {
    return new Response(null, { status: 404 });
  }

  return new Response(indexNowKey, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
