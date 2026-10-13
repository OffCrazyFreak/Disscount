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

// Erroring the request is not enough: the API client and React Query catch network
// errors, so a test could still pass. Recording them fails the test that made them.
// Listening here rather than in beforeAll patches fetch before any app module loads:
// better-auth's client keeps the fetch it saw at import and would bypass MSW.
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
