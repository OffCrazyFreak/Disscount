// The one place that knows how a request proves its account to Spring, so the token proxy
// swaps this file instead of every test that asks who a call acted as.

export const ANONYMOUS = "anonymous";

export function unsignedJwt(sub: string): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, "");
  const exp = Math.floor(Date.now() / 1000) + 600;
  return `${encode({ alg: "none" })}.${encode({ sub, exp })}.signature`;
}

export function actingAs(request: Request): string {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return ANONYMOUS;

  return (JSON.parse(atob(token.split(".")[1])) as { sub: string }).sub;
}
