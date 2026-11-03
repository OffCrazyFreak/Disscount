import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollSpy } from "@/hooks/use-scroll-spy";
import {
  findIntersectionObserver,
  stubIntersectionObserver,
} from "@/test/fake-intersection-observer";

const IDS = ["products", "stores", "price-history"];

function band() {
  return findIntersectionObserver((options) => !!options.rootMargin);
}

function end() {
  return findIntersectionObserver((options) => !!options.threshold);
}

function section(id: string) {
  return document.getElementById(id) as HTMLElement;
}

function placeAt(id: string, top: number) {
  section(id).getBoundingClientRect = () => ({ top }) as DOMRect;
}

function mountPage() {
  document.body.innerHTML = `
    <nav style="top: 100px"></nav>
    ${IDS.map((id) => `<section id="${id}" tabindex="-1"></section>`).join("")}
    <footer></footer>
  `;
  const navRef = { current: document.querySelector("nav") as HTMLElement };

  return renderHook(() => useScrollSpy(IDS, navRef));
}

describe("useScrollSpy", () => {
  beforeEach(() => {
    stubIntersectionObserver();
    window.history.replaceState(null, "", "/");
  });

  it("starts on the first section", () => {
    const { result } = mountPage();

    expect(result.current.activeId).toBe("products");
  });

  it("follows the topmost section crossing the band", () => {
    const { result } = mountPage();

    act(() =>
      band().fire([
        { target: section("stores"), isIntersecting: true },
        { target: section("price-history"), isIntersecting: true },
      ]),
    );
    expect(result.current.activeId).toBe("stores");

    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: false }]),
    );
    expect(result.current.activeId).toBe("price-history");
  });

  it("returns to the first section once the page is back above it", () => {
    const { result } = mountPage();
    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: true }]),
    );

    placeAt("products", 300);
    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: false }]),
    );

    expect(result.current.activeId).toBe("products");
  });

  it("marks a short last section once the end of a scrolled page is in view", () => {
    vi.stubGlobal("scrollY", 800);
    const { result } = mountPage();
    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: true }]),
    );

    placeAt("price-history", 400);
    act(() => end().fire([{ isIntersecting: true, intersectionRatio: 1 }]));

    expect(result.current.activeId).toBe("price-history");
  });

  it("stays on the first section when the whole page fits the screen", () => {
    vi.stubGlobal("scrollY", 0);
    const { result } = mountPage();

    placeAt("price-history", 400);
    act(() => end().fire([{ isIntersecting: true, intersectionRatio: 1 }]));

    expect(result.current.activeId).toBe("products");
  });

  it("keeps a clicked section underlined while its scroll runs", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { result } = mountPage();
    section("price-history").scrollIntoView = vi.fn();

    act(() => result.current.jumpTo("price-history"));
    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: true }]),
    );
    expect(result.current.activeId).toBe("price-history");

    act(() => window.dispatchEvent(new Event("scrollend")));
    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: true }]),
    );
    expect(result.current.activeId).toBe("stores");
  });

  it("lands on the section named in the URL hash", () => {
    window.history.replaceState(null, "", "/#stores");
    document.body.innerHTML = `<nav></nav><section id="stores" tabindex="-1"></section>`;
    const scrollIntoView = vi.fn();
    section("stores").scrollIntoView = scrollIntoView;
    const navRef = { current: document.querySelector("nav") as HTMLElement };

    renderHook(() => useScrollSpy(["products", "stores"], navRef));

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "instant",
    });
    expect(section("stores")).toHaveFocus();
  });
});
