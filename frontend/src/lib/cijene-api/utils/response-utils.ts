import { NextResponse } from "next/server";

/**
 * Creates a JSON response with common caching headers
 * Security headers are automatically added by middleware
 */
export function createApiResponse<T>(
  data: T,
  options: {
    status?: number;
    cacheControl?: string;
    additionalHeaders?: Record<string, string>;
  } = {}
) {
  const {
    status = 200,
    cacheControl = "no-cache",
    additionalHeaders = {},
  } = options;

  const response = NextResponse.json(data, { status });

  // Set cache control (security headers handled by middleware)
  response.headers.set("Cache-Control", cacheControl);

  // Add any additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Creates an error response with appropriate status and headers
 */
export function createApiError<T = any>(
  message: string,
  options: {
    status?: number;
    details?: T;
    additionalHeaders?: Record<string, string>;
  } = {}
) {
  const { status = 500, details, additionalHeaders = {} } = options;

  const errorData = details ? { error: message, details } : { error: message };

  return createApiResponse(errorData, {
    status,
    cacheControl: "no-cache",
    additionalHeaders,
  });
}
