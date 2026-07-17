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
 * Upstream errors keep their own status, while anything unrecognised becomes a
 * 502 so a broken proxy is never reported as the caller's mistake.
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
        status: 500,
        details: z.treeifyError(parsed.error),
      });
    }

    return createApiResponse(parsed.data);
  } catch (error) {
    if (error instanceof CijeneApiError) {
      return createApiError(error.message, {
        // A failed request never reached upstream and carries status 0
        status: error.status >= 400 ? error.status : 500,
        // avoid leaking headers or internal metadata
        details: error.response,
      });
    }

    return createApiError(`Failed to fetch ${resource} from upstream`, {
      status: 502,
    });
  }
}
