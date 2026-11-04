import { z } from "zod";
import {
  proxyProblem,
  type ProxyProblemCode,
} from "@/lib/backend-proxy/proxy-problem";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import { createApiResponse } from "@/lib/cijene-api/utils/response-utils";

/** Upstream errors the caller can act on keep their meaning; everything else becomes a 502, so a broken proxy is never the caller's mistake. */
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
    if (error instanceof CijeneApiError && isCallerFault(error.status)) {
      return proxyProblem(callerFaultProblem(error.status), request);
    }

    return proxyProblem("upstream_unavailable", request);
  }
}

/** Our token authenticates v1, so a 401 or 403 means misconfiguration; a 408 means upstream gave up on us, a retryable gateway failure. */
function isCallerFault(status: number): boolean {
  if (status === 401 || status === 403 || status === 408) return false;

  return status >= 400 && status < 500;
}

function callerFaultProblem(status: number): ProxyProblemCode {
  if (status === 404) return "not_found";
  if (status === 429) return "too_many_requests";

  return "bad_request";
}
