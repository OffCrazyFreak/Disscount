import type { init } from "@sentry/nextjs";

type DataCollection = NonNullable<
  NonNullable<Parameters<typeof init>[0]>["dataCollection"]
>;

type CollectBehavior = boolean | { allow: string[] } | { deny: string[] };

// Required<> is shallow, and Sentry fills a missing nested member from its collect-everything defaults.
type CompleteDataCollection = Required<
  Omit<DataCollection, "queryParams" | "httpHeaders" | "graphQL" | "genAI">
> & {
  httpHeaders: Required<
    Exclude<NonNullable<DataCollection["httpHeaders"]>, CollectBehavior>
  >;
  graphQL: Required<NonNullable<DataCollection["graphQL"]>>;
  genAI: Required<NonNullable<DataCollection["genAI"]>>;
};

// Sentry's own header name snippets for client IPs and proxy chains, from its v10 to v11 guide.
const IP_HEADER_SNIPPETS = ["forwarded", "-ip", "remote-", "via", "-user"];

/** Pins the privacy policy's baseline, because a left-out field collects everything; all fields required, so an upgrade fails the type check. */
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
  // Server frames hold request data the privacy policy does not list, and name filters miss minified names.
  stackFrameVariables: false,
  // v10 with sendDefaultPii sent 7; the dataCollection default would drop it to 5.
  frameContextLines: 7,
} satisfies CompleteDataCollection;
