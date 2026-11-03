import { z } from "zod";
import {
  proxyProblem,
  type ProxyProblemCode,
} from "@/lib/backend-proxy/proxy-problem";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import { createApiResponse } from "@/lib/cijene-api/utils/response-utils";

/**
 * Runs the shared tail of every Cijene proxy route: fetch upstream, validate the
 * payload, and turn any failure into a response.
 *
 * Every failure is a translated problem. An upstream error the caller could act
 * on keeps its meaning; everything else becomes a 502, so a broken proxy is
 * never reported as the caller's mistake.
 *
 * Param parsing stays in each route, since it differs per endpoint.
 */
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

/**
 * Whether an upstream status describes something the caller can fix. Our own
 * API token authenticates the v1 client, so a 401 or 403 means this proxy is
 * misconfigured, and reporting it as-is would tell the user they are logged
 * out. A 408 means upstream gave up waiting on us, so it is a gateway failure
 * that stays retryable. Status 0 means the request never landed at all.
 */
function isCallerFault(status: number): boolean {
  if (status === 401 || status === 403 || status === 408) return false;

  return status >= 400 && status < 500;
}

function callerFaultProblem(status: number): ProxyProblemCode {
  if (status === 404) return "not_found";
  if (status === 429) return "too_many_requests";

  return "bad_request";
}
