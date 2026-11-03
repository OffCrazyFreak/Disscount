// Server side only: in the browser every backend call goes through the Next.js rewrite instead.
export const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
