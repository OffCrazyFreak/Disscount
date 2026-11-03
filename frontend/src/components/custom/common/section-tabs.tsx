"use client";

import { useRef } from "react";
import { useFormatter } from "next-intl";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHashTab } from "@/hooks/use-hash-tab";
import type { ISectionTab } from "@/typings/section-tabs";

interface ISectionTabsProps {
  /** Names the tab list for screen readers; unique per page */
  label: string;
  tabs: ISectionTab[];
}

/**
 * A page's sections as tabs in a bar that sticks just under the header. Only
 * the open panel renders, so a heavy one such as price history loads on open.
 */
export default function SectionTabs({ label, tabs }: ISectionTabsProps) {
  const format = useFormatter();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { activeId, selectTab } = useHashTab(tabs.map((tab) => tab.id));

  // A single section needs no tabs, and its content reads as the page itself.
  if (tabs.length < 2) return <>{tabs[0]?.content}</>;

  function handleChange(id: string) {
    const root = rootRef.current;
    const list = listRef.current;

    // Opened from the stuck bar, the new panel starts under it, not scrolled past.
    if (root && list) {
      const stuckTop = parseFloat(getComputedStyle(list).top) || 0;
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
      <TabsList
        ref={listRef}
        variant="line"
        aria-label={label}
        className="sticky top-[calc(var(--header-bottom)+--spacing(3))] z-[var(--z-section-nav)] h-12 w-full justify-start rounded-none border-b bg-background p-0"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          const hasCount = !!tab.count && tab.count > 0;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              aria-label={tab.accessibleName}
              className="h-full min-w-0 rounded-none px-3 font-normal sm:flex-none data-[state=active]:font-semibold group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-0.75 after:rounded-t-full after:bg-primary after:forced-color-adjust-none forced-colors:after:bg-[Highlight]"
            >
              <span className="truncate">
                {tab.shortLabel ? (
                  <ResponsiveLabel full={tab.label} short={tab.shortLabel} />
                ) : (
                  tab.label
                )}
              </span>

              {/* Flex drops this space, but the accessible name keeps it: "Trgovine 3", not "Trgovine3". */}
              {hasCount && " "}

              {hasCount && (
                <span
                  className={
                    isActive
                      ? "shrink-0 rounded-full bg-primary/10 px-1.5 text-xs leading-5 font-medium text-primary tabular-nums"
                      : "shrink-0 rounded-full bg-muted px-1.5 text-xs leading-5 font-medium text-muted-foreground tabular-nums"
                  }
                >
                  {format.number(tab.count ?? 0)}
                  {tab.total !== undefined && `/${format.number(tab.total)}`}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
