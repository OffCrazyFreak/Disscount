const KIB = 1024;

// Far above the largest JSON form (the contact message) and far below what could tie up the server.
export const JSON_BODY_LIMIT = 64 * KIB;

// Spring's spring.servlet.multipart.max-request-size: one photo plus its thumbnail.
export const PHOTO_BODY_LIMIT = 1100 * KIB;

// UserRequest.image allows a 400,000 character avatar data URL; the other profile fields are tiny.
export const PROFILE_BODY_LIMIT = 400_000 + 8 * KIB;

const LARGER_BODIES = [
  {
    method: "PUT",
    path: /^digital-cards\/[^/]+\/photos\/[^/]+$/,
    limit: PHOTO_BODY_LIMIT,
  },
  {
    method: "POST",
    path: /^products\/[^/]+\/images$/,
    limit: PHOTO_BODY_LIMIT,
  },
  { method: "PATCH", path: /^users\/me$/, limit: PROFILE_BODY_LIMIT },
];

export function bodyLimit(method: string, segments: string[]): number {
  const path = segments.join("/");

  const route = LARGER_BODIES.find(
    (candidate) => candidate.method === method && candidate.path.test(path),
  );

  return route?.limit ?? JSON_BODY_LIMIT;
}

export const TOO_LARGE = Symbol("too large");

function declaresMoreThan(request: Request, limit: number): boolean {
  const declared = Number(request.headers.get("content-length"));

  return Number.isFinite(declared) && declared > limit;
}

function joinChunks(
  chunks: Uint8Array[],
  total: number,
): Uint8Array<ArrayBuffer> {
  const body = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

/** Counts the bytes as they arrive, because a chunked body carries no Content-Length to check. */
export async function readBodyWithin(
  request: Request,
  limit: number,
): Promise<Uint8Array<ArrayBuffer> | undefined | typeof TOO_LARGE> {
  if (!request.body) return undefined;
  if (declaresMoreThan(request, limit)) return TOO_LARGE;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;

    if (total > limit) {
      await reader.cancel();
      return TOO_LARGE;
    }

    chunks.push(value);
  }

  return joinChunks(chunks, total);
}
