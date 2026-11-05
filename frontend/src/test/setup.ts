import { afterAll, afterEach } from "vitest";

import { server } from "@/test/msw-server";

const undeclared: string[] = [];

function describeFrame(data: unknown, protocol: string) {
  if (typeof data === "object" && data !== null && "request" in data) {
    const { request } = data;
    if (request instanceof Request) return `${request.method} ${request.url}`;
  }

  return protocol;
}

// Recording fails the test, as the client swallows network errors; not beforeAll, as better-auth keeps its fetch.
server.listen({
  onUnhandledFrame({ frame, defaults }) {
    undeclared.push(describeFrame(frame.data, frame.protocol));
    defaults.error();
  },
});

afterEach(() => {
  server.resetHandlers();

  const requests = undeclared.splice(0);
  if (requests.length > 0) {
    throw new Error(`Requests with no MSW handler: ${requests.join(", ")}`);
  }
});

afterAll(() => server.close());
