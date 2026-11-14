import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";
import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("isolates latest and public credentials without logging headers", async () => {
  vi.stubEnv("CIJENE_API_URL", "https://history.example");
  vi.stubEnv("CIJENE_API_TOKEN", "public-test-token");
  vi.stubEnv("CIJENE_LATEST_API_URL", "https://latest.example");
  vi.stubEnv("CIJENE_LATEST_API_TOKEN", "owned-test-token");
  vi.resetModules();
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const seen: string[] = [];
  server.use(
    http.get("https://history.example/v1/products/test", ({ request }) => {
      seen.push(request.headers.get("authorization") ?? "");
      return HttpResponse.json({});
    }),
    http.get("https://latest.example/v1/products/test", ({ request }) => {
      seen.push(request.headers.get("authorization") ?? "");
      return HttpResponse.json(
        { detail: request.headers.get("authorization") },
        { status: 500 },
      );
    }),
  );
  const { cijeneApiV1Client, cijeneLatestClient } =
    await import("@/lib/cijene-api/client");
  await cijeneApiV1Client.get("/products/test");
  await expect(cijeneLatestClient!.get("/products/test")).rejects.toBeDefined();
  expect(seen).toEqual(["Bearer public-test-token", "Bearer owned-test-token"]);
  expect(JSON.stringify(log.mock.calls)).not.toContain("owned-test-token");
  log.mockRestore();
});
