import { vi } from "vitest";

interface IFakeIntersectionObserver {
  options: IntersectionObserverInit;
  observed: Set<Element>;
  isDisconnected: boolean;
  fire: (entries: Partial<IntersectionObserverEntry>[]) => void;
}

let instances: IFakeIntersectionObserver[] = [];

/** Swaps in a stand-in for jsdom's missing IntersectionObserver that tests fire by hand. */
export function stubIntersectionObserver() {
  instances = [];

  // A plain function, not an arrow, because the code under test calls it with `new`.
  vi.stubGlobal(
    "IntersectionObserver",
    function FakeIntersectionObserver(
      callback: IntersectionObserverCallback,
      options: IntersectionObserverInit = {},
    ) {
      const observer = {
        options,
        observed: new Set<Element>(),
        isDisconnected: false,
        observe: (element: Element) => observer.observed.add(element),
        unobserve: (element: Element) => observer.observed.delete(element),
        disconnect: () => {
          observer.isDisconnected = true;
          observer.observed.clear();
        },
        takeRecords: () => [],
        fire: (entries: Partial<IntersectionObserverEntry>[]) =>
          callback(
            entries as IntersectionObserverEntry[],
            observer as unknown as IntersectionObserver,
          ),
      };
      instances.push(observer);

      return observer;
    },
  );
}

/** The newest live observer whose options match. */
export function findIntersectionObserver(
  match: (options: IntersectionObserverInit) => boolean,
) {
  const live = instances.filter(
    (observer) => !observer.isDisconnected && match(observer.options),
  );

  return live[live.length - 1];
}
