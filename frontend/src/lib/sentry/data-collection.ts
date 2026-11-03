import type { init } from "@sentry/nextjs";

type DataCollection = NonNullable<
  NonNullable<Parameters<typeof init>[0]>["dataCollection"]
>;

// Sentry's own header name snippets for client IPs and proxy chains, from its v10 to v11 guide.
const IP_HEADER_SNIPPETS = ["forwarded", "-ip", "remote-", "via", "-user"];

/**
 * Shared by every Sentry.init (client, server, edge). It pins the v10 `sendDefaultPii: false`
 * baseline the privacy policy describes (no IP address, no automatic user details), because
 * any field left out falls back to Sentry's defaults, which collect everything. Every field is
 * required here, so a Sentry upgrade that adds a category fails the type check until it is
 * decided instead of silently collecting it.
 */
export const sentryDataCollection = {
  // Also decides whether Sentry infers the IP address from the connection.
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: IP_HEADER_SNIPPETS },
    response: { deny: IP_HEADER_SNIPPETS },
  },
  httpBodies: [],
  urlQueryParams: { deny: IP_HEADER_SNIPPETS },
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  stackFrameVariables: true,
  // v10 with sendDefaultPii sent 7; the dataCollection default would drop it to 5.
  frameContextLines: 7,
} satisfies Required<Omit<DataCollection, "queryParams">>;
