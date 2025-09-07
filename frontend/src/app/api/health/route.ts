import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { healthCheckResponseSchema } from "@/lib/cijene-api/schemas";

const CIJENE_API_URL = process.env.CIJENE_API_URL || "https://api.cijene.dev";

export async function GET(request: NextRequest) {
  try {
    const response = await axios.get(`${CIJENE_API_URL}/health`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Validate response
    const validatedData = healthCheckResponseSchema.parse(response.data);

    // Create response with security and caching headers
    const nextResponse = NextResponse.json(validatedData);
    nextResponse.headers.set("X-Content-Type-Options", "nosniff");
    nextResponse.headers.set("X-Frame-Options", "DENY");
    nextResponse.headers.set("X-XSS-Protection", "1; mode=block");
    nextResponse.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    nextResponse.headers.set(
      "Cache-Control",
      "public, max-age=30, s-maxage=60"
    ); // 30s browser, 1min CDN

    return nextResponse;
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { error: "Failed to check health" },
      { status: 500 }
    );
  }
}
