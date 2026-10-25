"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import ScrollFade from "@/components/custom/common/scroll-fade";
import { SIDEBAR_ICON_CLASS } from "@/components/custom/sidebar/sidebar-styles";
import { cn } from "@/lib/utils";
import type { INavigationItem } from "@/constants/navigation";

export interface ISidebarFilterOption {
  value: string;
  label: string;
  count: number;
}

interface ISidebarFilterMenuProps {
  item: INavigationItem;
  filterKey: "chain" | "location";
  options: ISidebarFilterOption[];
  selected: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Collapsible list of products filter links, e.g. store chains or cities. */
export default function SidebarFilterMenu({
  item,
  filterKey,
  options,
  selected,
  isOpen,
  onOpenChange,
}: ISidebarFilterMenuProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLUListElement>(null);
  const Icon = item.icon;

  // From /products itself, other filters survive and only this key is replaced.
  function buildHref(value: string): string {
    const params = new URLSearchParams(
      pathname.startsWith("/products") ? searchParams.toString() : "",
    );
    params.set(filterKey, value);

    return `/products?${params.toString()}`;
  }

  return (
    <Collapsible
      asChild
      open={isOpen}
      onOpenChange={onOpenChange}
      className="group/collapsible"
    >
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            type="button"
            className={cn("cursor-pointer", SIDEBAR_ICON_CLASS)}
          >
            <Icon />
            <span>{t(item.labelKey)}</span>
            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            <span className="sr-only">{t("sidebar.toggle")}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="relative">
            <ScrollFade
              targetRef={listRef}
              side="top"
              className="from-sidebar"
            />

            <SidebarMenuSub ref={listRef} className="max-h-80 overflow-y-auto">
              {options.map((option) => (
                <SidebarMenuSubItem key={option.value}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={selected.includes(option.value)}
                  >
                    {/* The primitive's fixed h-7 clips a name that wraps, and
                        its truncate rule squeezes the count to "(…". */}
                    <Link
                      href={buildHref(option.value)}
                      className="h-auto min-h-7 justify-between gap-2 py-1 [&>span:last-child]:overflow-visible"
                    >
                      <span className="min-w-0 break-words">
                        {option.label}
                      </span>
                      <span className="shrink-0 tabular-nums">{`(${option.count})`}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>

            <ScrollFade targetRef={listRef} className="from-sidebar" />
          </div>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  );
}
