import { z } from "zod";
import { CijeneApiError } from "@/lib/cijene-api/errors";
import {
  createApiResponse,
  createApiError,
} from "@/lib/cijene-api/utils/response-utils";

/**
 * Runs the shared tail of every Cijene proxy route: fetch upstream, validate the
 * payload, and turn any failure into a response.
 *
 * An upstream error the caller could act on keeps its own status; everything
 * else becomes a 502, so a broken proxy is never reported as the caller's
 * mistake.
 *
 * Param parsing stays in each route, since it differs per endpoint.
 */
export async function withCijeneRoute<TSchema extends z.ZodType>(
  resource: string,
  schema: TSchema,
  fetcher: () => Promise<{ data: unknown }>
) {
  try {
    const response = await fetcher();
    const parsed = schema.safeParse(response.data);

    if (!parsed.success) {
      return createApiError("Invalid response from external API", {
        status: 502,
        details: z.treeifyError(parsed.error),
      });
    }

    return createApiResponse(parsed.data);
  } catch (error) {
    if (error instanceof CijeneApiError && isCallerFault(error.status)) {
      return createApiError(error.message, { status: error.status });
    }

    return createApiError(`Failed to fetch ${resource} from upstream`, {
      status: 502,
    });
  }
}

/**
 * Whether an upstream status describes something the caller can fix. Our own
 * API token authenticates the v1 client, so a 401 or 403 means this proxy is
 * misconfigured, and reporting it as-is would tell the user they are logged
 * out. Status 0 means the request never landed at all.
 */
function isCallerFault(status: number): boolean {
  if (status === 401 || status === 403) return false;

  return status >= 400 && status < 500;
}
