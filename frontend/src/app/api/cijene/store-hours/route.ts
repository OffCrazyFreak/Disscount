import { getStoreHours } from "@/lib/store-hours/get-store-hours";
import {
  createApiError,
  createApiResponse,
} from "@/lib/cijene-api/utils/response-utils";

// Reads the database, so it must never be prerendered at build.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return createApiResponse(await getStoreHours(), {
      cacheControl: "public, max-age=3600, stale-while-revalidate=86400",
    });
  } catch (error) {
    console.error("[store-hours] failed", error);

    return createApiError("Failed to load store hours", { status: 502 });
  }
}
