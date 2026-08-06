/**
 * Drops the errors Serwist's service-worker registration throws in environments that
 * cannot have a service worker at all.
 *
 * `@serwist/next` injects the `navigator.serviceWorker.register()` call itself, so there is
 * no call site of ours to catch these on. Registration legitimately fails for Google's
 * renderer (which stubs `register`) and in storage-restricted browsers, and the failure is
 * harmless: the app runs without offline caching.
 *
 * Serwist's `register()` does `this._registration = await this._registerScript()` and then
 * reads `this._registration.waiting`, so how the environment stubs `register` decides which
 * of two errors you get, and you never get both from one call:
 *
 * - stub **rejects**: the `await` propagates, surfacing as an unhandled `Rejected` rejection
 * - stub **resolves `undefined`**: the `.waiting` read throws a TypeError
 *
 * Matched on the message *and* a registration frame together, because either message alone
 * is generic enough to swallow a real error later.
 */
const NOISE_MESSAGES = [
  // Anchored: as a substring, "Rejected" would also match things like a WAF's
  // "Request Rejected".
  /^Rejected$/,
  // Matched on the identifiers rather than the sentence, because the wording is engine
  // specific: V8 says "Cannot read properties of undefined (reading 'waiting')",
  // SpiderMonkey "this._registration is undefined", JavaScriptCore "undefined is not an
  // object (evaluating 'this._registration.waiting')". Requiring a registration frame
  // alongside is what keeps this narrow.
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
