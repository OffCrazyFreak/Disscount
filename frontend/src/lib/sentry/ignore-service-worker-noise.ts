/** @serwist/next injects the entry point, so no call site can catch these; message and frame are matched together, as either alone is too generic. */
const NOISE_MESSAGES = [
  // Anchored, because as a substring "Rejected" would also match things like a WAF's "Request Rejected".
  /^Rejected$/,
  // Matched on identifiers because the wording is engine specific; requiring a registration frame alongside keeps this narrow.
  /_registration|reading 'waiting'/,
];

// Minified to `o.register` / `o._registerScript`; Google's shim adds a longer dotted path.
const REGISTRATION_FRAME = /(^|\.)(register|_registerScript)$/;

interface IServiceWorkerEvent {
  exception?: {
    values?: {
      value?: string;
      stacktrace?: { frames?: { function?: string }[] };
    }[];
  };
}

export function isServiceWorkerRegistrationNoise(
  event: IServiceWorkerEvent,
): boolean {
  return (event.exception?.values ?? []).some((exception) => {
    const message = exception.value?.trim();
    if (!message) return false;

    if (!NOISE_MESSAGES.some((pattern) => pattern.test(message))) return false;

    return (exception.stacktrace?.frames ?? []).some((frame) =>
      REGISTRATION_FRAME.test(frame.function ?? ""),
    );
  });
}
