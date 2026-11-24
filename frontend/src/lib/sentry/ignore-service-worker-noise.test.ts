import { describe, expect, it } from "vitest";

import { isServiceWorkerRegistrationNoise } from "@/lib/sentry/ignore-service-worker-noise";

const FETCH_FAILURE =
  "Failed to register a ServiceWorker for scope ('https://disscount.me/') with script ('https://disscount.me/sw.js'): An unknown error occurred when fetching the script.";

function eventWith(
  ...values: { value: string; frames?: string[] }[]
): Parameters<typeof isServiceWorkerRegistrationNoise>[0] {
  return {
    exception: {
      values: values.map(({ value, frames }) => ({
        value,
        stacktrace: frames
          ? { frames: frames.map((name) => ({ function: name })) }
          : undefined,
      })),
    },
  };
}

describe("isServiceWorkerRegistrationNoise", () => {
  it("drops Chromium's frameless script fetch failure", () => {
    expect(
      isServiceWorkerRegistrationNoise(eventWith({ value: FETCH_FAILURE })),
    ).toBe(true);
  });

  it("drops the fetch failure when a wrapper exception comes first", () => {
    const event = eventWith(
      { value: `AbortError: ${FETCH_FAILURE}` },
      { value: FETCH_FAILURE },
    );
    expect(isServiceWorkerRegistrationNoise(event)).toBe(true);
  });

  it("drops Serwist's stub errors only with a registration frame", () => {
    expect(
      isServiceWorkerRegistrationNoise(
        eventWith({ value: "Rejected", frames: ["o.register"] }),
      ),
    ).toBe(true);
    expect(
      isServiceWorkerRegistrationNoise(eventWith({ value: "Rejected" })),
    ).toBe(false);
  });

  it("keeps a registration that got a bad HTTP response", () => {
    const event = eventWith({
      value:
        "Failed to register a ServiceWorker for scope ('https://disscount.me/') with script ('https://disscount.me/sw.js'): A bad HTTP response code (404) was received when fetching the script.",
    });
    expect(isServiceWorkerRegistrationNoise(event)).toBe(false);
  });

  it("keeps unrelated errors", () => {
    expect(
      isServiceWorkerRegistrationNoise(eventWith({ value: "Network Error" })),
    ).toBe(false);
  });
});
