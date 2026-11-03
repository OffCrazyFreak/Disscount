"use client";

import { useRef, type MouseEvent } from "react";
import { useFormatter } from "next-intl";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { cn } from "@/lib/utils";
import type { ISectionJumpNavItem } from "@/typings/section-jump-nav";

interface ISectionJumpNavProps {
  /** Unique per page; screen readers already announce the landmark as navigation */
  label: string;
  sections: ISectionJumpNavItem[];
}

function isPlainClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * Sticky in-page links under the header, underlining the section being read.
 * Plain links in a nav rather than tabs: every section stays on the page, so
 * there is no single panel for a tablist to switch.
 */
export default function SectionJumpNav({
  label,
  sections,
}: ISectionJumpNavProps) {
  const format = useFormatter();
  const navRef = useRef<HTMLElement>(null);
  const { activeId, jumpTo } = useScrollSpy(
    sections.map((section) => section.id),
    navRef,
  );

  if (sections.length < 2) return null;

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="sticky top-[var(--header-bottom)] z-[var(--z-section-nav)] h-[var(--section-nav-height)] rounded-xl border bg-card shadow-sm"
    >
      <ul className="grid h-full grid-flow-col auto-cols-fr sm:flex sm:gap-1 sm:px-1">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          const hasCount = !!section.count && section.count > 0;

          return (
            <li key={section.id} className="h-full min-w-0">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => {
                  // Modified clicks keep their browser meaning, such as a new tab.
                  if (!isPlainClick(event)) return;

                  event.preventDefault();
                  jumpTo(section.id);
                }}
                className={cn(
                  "relative flex h-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                  isActive && "font-semibold text-foreground",
                )}
              >
                <span className="truncate">
                  {section.shortLabel ? (
                    <ResponsiveLabel
                      full={section.label}
                      short={section.shortLabel}
                    />
                  ) : (
                    section.label
                  )}
                </span>

                {/* Flex drops this space, but the accessible name keeps it: "Trgovine 3", not "Trgovine3". */}
                {hasCount && " "}

                {hasCount && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 text-xs leading-5 font-medium tabular-nums",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {format.number(section.count ?? 0)}
                  </span>
                )}

                {isActive && (
                  // Opted out of forced colors, which would paint the bar as background and hide it.
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0 h-0.75 rounded-t-full bg-primary forced-color-adjust-none forced-colors:bg-[Highlight]"
                  />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
