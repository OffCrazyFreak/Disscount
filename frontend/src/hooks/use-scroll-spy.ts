"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Safari has no scrollend yet, so a click's hold on the underline also times out.
const JUMP_HOLD_FALLBACK_MS = 1200;

/** Where a section counts as being read: just under the stuck bar. */
function readActiveLine(nav: HTMLElement): number {
  // The sticky top resolves to px, so this follows the header's measured size.
  return parseFloat(getComputedStyle(nav).top) + nav.offsetHeight;
}

/** Brings a section under the bar and moves focus into it, as a native anchor jump would. */
function scrollToSection(section: HTMLElement, isInstant: boolean) {
  section.focus({ preventScroll: true });
  // "instant", not "auto": auto follows the root's smooth scroll-behavior.
  section.scrollIntoView({
    block: "start",
    behavior: isInstant ? "instant" : "smooth",
  });
}

/**
 * Tracks which of `sectionIds` is being read, for a sticky bar of in-page
 * links (`navRef`), and jumps to a section on request.
 *
 * A thin IntersectionObserver band under the bar marks the topmost section
 * crossing it. A short last section never reaches the band, so it takes over
 * once the footer is fully in view on a scrolled page.
 */
export function useScrollSpy(
  sectionIds: readonly string[],
  navRef: RefObject<HTMLElement | null>,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isJumpingRef = useRef(false);
  const releaseJumpRef = useRef<(() => void) | null>(null);
  const hasHandledHashRef = useRef(false);
  const idsKey = sectionIds.join(" ");

  useEffect(() => {
    const nav = navRef.current;
    const sections = idsKey
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (
      !nav ||
      sections.length < 2 ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const first = sections[0];
    const last = sections[sections.length - 1];
    const inBand = new Set<string>();
    let isAtEnd = false;
    let band: IntersectionObserver | null = null;

    function pick() {
      if (isJumpingRef.current || !nav) return;

      const line = readActiveLine(nav);
      if (isAtEnd && last.getBoundingClientRect().top > line) {
        setActiveId(last.id);
        return;
      }

      const crossing = sections.find((section) => inBand.has(section.id));
      if (crossing) setActiveId(crossing.id);
      else if (first.getBoundingClientRect().top > line) setActiveId(first.id);
    }

    function observeBand() {
      if (!nav) return;

      band?.disconnect();
      inBand.clear();

      const line = readActiveLine(nav);
      const below = Math.max(0, window.innerHeight - line);
      const bandHeight = Math.max(1, Math.round(below * 0.25));

      band = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) inBand.add(entry.target.id);
            else inBand.delete(entry.target.id);
          }
          pick();
        },
        { rootMargin: `-${line}px 0px -${below - bandHeight}px 0px` },
      );
      sections.forEach((section) => band?.observe(section));
    }

    const end = new IntersectionObserver(
      ([entry]) => {
        // A page that fits the screen has no end to reach, so it stays on its first section.
        isAtEnd = entry.intersectionRatio >= 0.99 && window.scrollY > 0;
        pick();
      },
      { threshold: [0, 0.99] },
    );
    const footer = document.querySelector("footer");
    if (footer) end.observe(footer);

    observeBand();
    // The band hangs off the header's size, which the header publishes on the root's style.
    const headerWatcher = new MutationObserver(observeBand);
    headerWatcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    window.addEventListener("resize", observeBand);

    return () => {
      band?.disconnect();
      end.disconnect();
      headerWatcher.disconnect();
      window.removeEventListener("resize", observeBand);
    };
  }, [idsKey, navRef]);

  useEffect(() => () => releaseJumpRef.current?.(), []);

  function holdUntilScrollEnds() {
    releaseJumpRef.current?.();
    isJumpingRef.current = true;

    function release() {
      isJumpingRef.current = false;
      window.clearTimeout(timer);
      window.removeEventListener("scrollend", release);
      releaseJumpRef.current = null;
    }

    const timer = window.setTimeout(release, JUMP_HOLD_FALLBACK_MS);
    window.addEventListener("scrollend", release);
    releaseJumpRef.current = release;
  }

  function jumpTo(id: string) {
    const section = document.getElementById(id);
    if (!section) return;

    holdUntilScrollEnds();
    setActiveId(id);
    scrollToSection(
      section,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    window.history.replaceState(window.history.state, "", `#${id}`);
  }

  // Sections render after their data loads, too late for the browser's own hash jump.
  useEffect(() => {
    if (hasHandledHashRef.current) return;

    const hash = decodeURIComponent(window.location.hash.slice(1));
    const section = idsKey.split(" ").includes(hash)
      ? document.getElementById(hash)
      : null;
    if (!section) return;

    hasHandledHashRef.current = true;
    scrollToSection(section, true);
  }, [idsKey]);

  const isKnown = activeId !== null && sectionIds.includes(activeId);

  return {
    activeId: isKnown ? activeId : (sectionIds[0] ?? null),
    jumpTo,
  };
}
