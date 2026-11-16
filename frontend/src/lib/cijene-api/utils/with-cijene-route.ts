import { z } from "zod";
import {
  proxyProblem,
  type ProxyProblemCode,
} from "@/lib/backend-proxy/proxy-problem";
import {
  CURSOR_EXPIRED,
  SEARCH_TIMEOUT,
} from "@/lib/backend-proxy/proxy-contract";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import { createApiResponse } from "@/lib/cijene-api/utils/response-utils";

/** Everything but actionable upstream errors becomes a 502, so a broken proxy is not the caller's fault. */
export async function withCijeneRoute<TSchema extends z.ZodType>(
  request: Request,
  resource: string,
  schema: TSchema,
  fetcher: () => Promise<{ data: unknown }>,
) {
  try {
    const response = await fetcher();
    const parsed = schema.safeParse(response.data);

    if (!parsed.success) {
      console.error(
        `[cijene] invalid ${resource} response`,
        z.treeifyError(parsed.error),
      );

      return proxyProblem("upstream_unavailable", request);
    }

    return createApiResponse(parsed.data);
  } catch (error) {
    if (!(error instanceof CijeneApiError)) {
      return proxyProblem("upstream_unavailable", request);
    }

    const forwarded = forwardedProblem(error);
    if (forwarded) return proxyProblem(forwarded, request);

    if (isCallerFault(error.status)) {
      return proxyProblem(callerFaultProblem(error.status), request);
    }

    return proxyProblem("upstream_unavailable", request);
  }
}

const upstreamDetailSchema = z.object({ detail: z.string() });

/** Only these two details change what the browser does, so every other one stays generic. */
function forwardedProblem(error: CijeneApiError): ProxyProblemCode | null {
  const detail = upstreamDetailSchema.safeParse(error.response).data?.detail;

  if (error.status === 409 && detail === CURSOR_EXPIRED) return CURSOR_EXPIRED;
  if (error.status === 503 && detail === SEARCH_TIMEOUT) return SEARCH_TIMEOUT;

  return null;
}

/** Our token authenticates v1, so 401 or 403 means misconfiguration; 408 is a retryable gateway failure. */
function isCallerFault(status: number): boolean {
  if (status === 401 || status === 403 || status === 408) return false;

  return status >= 400 && status < 500;
}

function callerFaultProblem(status: number): ProxyProblemCode {
  if (status === 404) return "not_found";
  if (status === 429) return "too_many_requests";

  return "bad_request";
}
