import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

type ParsedBody<T> = { data: T; response?: never } | { response: NextResponse };

// For our own account routes: unreadable JSON and a schema miss are separate 400s.
export async function parseAccountBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParsedBody<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: "invalid_request" },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: NextResponse.json({ error: "invalid_input" }, { status: 400 }),
    };
  }

  return { data: parsed.data };
}
