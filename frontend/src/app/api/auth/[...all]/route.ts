import { auth } from "@/lib/auth";
import { withTrustedClientIp } from "@/lib/client-ip/client-ip";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export function GET(request: Request) {
  return handler.GET(withTrustedClientIp(request));
}

export function POST(request: Request) {
  return handler.POST(withTrustedClientIp(request));
}
