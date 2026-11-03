"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { useFormatter } from "next-intl";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHashTab } from "@/hooks/use-hash-tab";
import { useIsStuck } from "@/hooks/use-is-stuck";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { cn } from "@/lib/utils";
import type { ISectionTab } from "@/typings/section-tabs";

const LAYOUT_TRANSITION = {
  type: "spring",
  bounce: 0.15,
  duration: 0.45,
} as const;

const SINGLE_PANEL_PROPS = {
  role: undefined,
  "aria-labelledby": undefined,
  tabIndex: undefined,
};

interface ISectionTabsProps {
  /** Names the tab list for screen readers; unique per page */
  label: string;
  tabs: ISectionTab[];
}

/**
 * A page's sections as tabs in a bar that sticks just under the header, where it
 * morphs into a centred pill like the chart period tabs. Only the open panel
 * renders, so a heavy one such as price history loads on open.
 */
export default function SectionTabs({ label, tabs }: ISectionTabsProps) {
  const format = useFormatter();
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const { activeId, selectTab } = useHashTab(tabs.map((tab) => tab.id));
  const isStuck = useIsStuck(rootRef, barRef);
  const transition = useReducedMotionSafe()
    ? { duration: 0 }
    : LAYOUT_TRANSITION;

  // One section needs no tabs and reads as the page itself. The tree stays the same, so
  // content does not remount (losing focus and drafts) when a second section appears.
  const hasTabs = tabs.length > 1;

  function handleChange(id: string) {
    const root = rootRef.current;
    const bar = barRef.current;

    // Opened from the stuck bar, the new panel starts under it, not scrolled past.
    if (root && bar) {
      const stuckTop = parseFloat(getComputedStyle(bar).top) || 0;
      const overshoot = root.getBoundingClientRect().top - stuckTop;
      if (overshoot < 0)
        window.scrollBy({ top: overshoot, behavior: "instant" });
    }

    selectTab(id);
  }

  return (
    <Tabs
      ref={rootRef}
      value={activeId}
      onValueChange={handleChange}
      className="gap-4"
    >
      {hasTabs && (
        // The bar holds its height while the list inside changes shape, so the page never shifts.
        <div
          ref={barRef}
          className="sticky top-[calc(var(--header-bottom)+--spacing(3))] z-[var(--z-section-nav)] h-12"
        >
          <TabsList
            asChild
            variant={isStuck ? "default" : "line"}
            aria-label={label}
            className={cn(
              "h-full",
              isStuck
                ? "mx-auto flex rounded-xl border bg-muted p-1 shadow-md"
                : // A full width grey track; each tab owns an equal share of it.
                  "relative w-full rounded-none p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-0.75 before:rounded-full before:bg-border",
            )}
          >
            <motion.div layout transition={transition}>
              {tabs.map((tab) => {
                const isActive = tab.id === activeId;
                const hasCount = !!tab.count && tab.count > 0;

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    asChild
                    aria-label={tab.accessibleName}
                    className={cn(
                      "h-full min-w-0 font-normal transition-[color,background-color,box-shadow] data-[state=active]:font-semibold",
                      isStuck
                        ? "flex-none rounded-lg px-4 text-[1.0625rem]"
                        : "rounded-none px-3 text-[1.0625rem] data-[state=active]:bg-linear-to-t data-[state=active]:bg-origin-border data-[state=active]:from-primary/10 data-[state=active]:to-transparent data-[state=active]:to-75% group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-0.75 after:rounded-full after:bg-primary after:forced-color-adjust-none forced-colors:after:bg-[Highlight]",
                    )}
                  >
                    <motion.button layout="position" transition={transition}>
                      <span
                        className={cn(
                          "relative isolate inline-flex min-w-0 items-center gap-1.5",
                          // The landing page's glow, per label, so the page's dots never run through the words.
                          !isStuck &&
                            "before:pointer-events-none before:absolute before:-inset-x-4 before:-inset-y-2 before:-z-10 before:bg-[radial-gradient(ellipse_closest-side,var(--background)_60%,transparent_100%)]",
                        )}
                      >
                        <span className="truncate">
                          {tab.shortLabel ? (
                            <ResponsiveLabel
                              full={tab.label}
                              short={tab.shortLabel}
                            />
                          ) : (
                            tab.label
                          )}
                        </span>

                        {/* Flex drops this space, but the accessible name keeps it: "Trgovine 3", not "Trgovine3". */}
                        {hasCount && " "}

                        {hasCount && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 text-xs leading-5 font-medium tabular-nums",
                              !isActive &&
                                "bg-background text-muted-foreground",
                              isActive &&
                                !isStuck &&
                                "bg-primary/10 text-primary",
                              // On the stuck pill the open tab is filled green, so its badge turns white.
                              isActive && isStuck && "bg-white text-primary",
                            )}
                          >
                            {format.number(tab.count ?? 0)}
                            {tab.total !== undefined &&
                              `/${format.number(tab.total)}`}
                          </span>
                        )}
                      </span>
                    </motion.button>
                  </TabsTrigger>
                );
              })}
            </motion.div>
          </TabsList>
        </div>
      )}

      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          // Without a tab list there is no tab to label the panel or to tab out of.
          {...(!hasTabs && SINGLE_PANEL_PROPS)}
          className="rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
