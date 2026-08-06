/**
 * Drops the two errors Serwist's service-worker registration throws in environments that
 * cannot have a service worker at all.
 *
 * `@serwist/next` injects the `navigator.serviceWorker.register()` call itself, so there is
 * no call site of ours to catch the rejection on. Registration legitimately fails for
 * Google's renderer (which stubs `register` to reject outright) and in storage-restricted
 * browsers, and the failure is harmless: the app runs without offline caching. Serwist then
 * reads `registration.waiting` on the registration that was never assigned, so one failure
 * surfaces as two unrelated-looking issues.
 *
 * Matched on the message *and* a registration frame together, because "Rejected" on its own
 * is generic enough to swallow a real error later.
 */
const REGISTRATION_MESSAGES = [
  "Rejected",
  "Cannot read properties of undefined (reading 'waiting')",
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
    const message = exception.value;
    if (!message) return false;

    if (!REGISTRATION_MESSAGES.some((known) => message.includes(known))) {
      return false;
    }

    return (exception.stacktrace?.frames ?? []).some((frame) =>
      REGISTRATION_FRAME.test(frame.function ?? ""),
    );
  });
}
