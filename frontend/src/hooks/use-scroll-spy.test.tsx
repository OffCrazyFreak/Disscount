import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HEADER_BOTTOM_CHANGE_EVENT } from "@/hooks/use-header-bottom-variable";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import {
  findIntersectionObserver,
  stubIntersectionObserver,
} from "@/test/fake-intersection-observer";

const IDS = ["products", "stores", "price-history"];

function band() {
  return findIntersectionObserver((options) => !!options.rootMargin);
}

function section(id: string) {
  return document.getElementById(id) as HTMLElement;
}

function placeAt(id: string, top: number) {
  section(id).getBoundingClientRect = () => ({ top }) as DOMRect;
}

/** A page 1600px tall in an 800px window, scrolled to `scrollY`. */
function scrollPageTo(scrollY: number) {
  vi.stubGlobal("innerHeight", 800);
  vi.stubGlobal("scrollY", scrollY);
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: 1600,
  });
}

function mountPage(ids = IDS, navStyle = 'style="top: 100px"') {
  document.body.innerHTML = `
    <nav ${navStyle}></nav>
    ${ids.map((id) => `<section id="${id}" tabindex="-1"></section>`).join("")}
  `;
  const navRef = { current: document.querySelector("nav") as HTMLElement };

  return renderHook(({ sectionIds }) => useScrollSpy(sectionIds, navRef), {
    initialProps: { sectionIds: ids },
  });
}

describe("useScrollSpy", () => {
  beforeEach(() => {
    stubIntersectionObserver();
    scrollPageTo(0);
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

  it("marks a short last section once the page is scrolled to the bottom", () => {
    const { result } = mountPage();
    act(() =>
      band().fire([{ target: section("stores"), isIntersecting: true }]),
    );

    placeAt("price-history", 400);
    scrollPageTo(800);
    act(() => window.dispatchEvent(new Event("scroll")));

    expect(result.current.activeId).toBe("price-history");
  });

  it("stays on the first section when the whole page fits the screen", () => {
    const { result } = mountPage();

    placeAt("price-history", 400);
    act(() => window.dispatchEvent(new Event("scroll")));

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

  it("rebuilds the band only when the header publishes a new height", () => {
    mountPage();
    const before = band();

    document.documentElement.style.setProperty("color-scheme", "light");
    expect(band()).toBe(before);

    document.querySelector("nav")?.setAttribute("style", "top: 140px");
    act(() => window.dispatchEvent(new Event(HEADER_BOTTOM_CHANGE_EVENT)));

    expect(band()).not.toBe(before);
    expect(band().options.rootMargin).toMatch(/^-140px /);
  });

  it("builds a valid band when the bar has no resolved top", () => {
    mountPage(IDS, "");

    expect(band().options.rootMargin).toMatch(/^-0px /);
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

  it("does not jump back to its own hash when the sections change later", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const { result, rerender } = mountPage(["products", "stores"]);
    const scrollIntoView = vi.fn();
    section("stores").scrollIntoView = scrollIntoView;

    act(() => result.current.jumpTo("stores"));
    const elsewhere = document.createElement("button");
    document.body.append(elsewhere);
    elsewhere.focus();

    document.body.insertAdjacentHTML(
      "beforeend",
      '<section id="price-history" tabindex="-1"></section>',
    );
    rerender({ sectionIds: IDS });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(elsewhere).toHaveFocus();
  });
});
