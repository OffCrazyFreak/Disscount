import { Unzip, UnzipInflate } from "fflate";

import { createMemberScanner } from "@/lib/store-locations/dgu/gml-scanner";

/**
 * Streams a zip and hands each entry's GML members to the handler registered
 * under the entry's file name. Entries without a handler are skipped unread.
 */
export async function scanZipMembers(
  body: ReadableStream<Uint8Array>,
  handlers: Record<string, (member: string) => void>,
  signal: AbortSignal,
): Promise<void> {
  const unzip = new Unzip();
  unzip.register(UnzipInflate);

  let failure: unknown = null;

  unzip.onfile = (file) => {
    const handler = handlers[file.name];

    if (!handler) return;

    const scanner = createMemberScanner(handler);

    file.ondata = (error, chunk, final) => {
      if (error) failure ??= error;
      else if (failure === null) scanner.write(chunk);

      if (final && failure === null) scanner.end();
    };

    file.start();
  };

  const reader = body.getReader();

  try {
    while (true) {
      signal.throwIfAborted();

      const { done, value } = await reader.read();

      unzip.push(value ?? new Uint8Array(0), done);

      if (failure !== null) throw failure;
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}
