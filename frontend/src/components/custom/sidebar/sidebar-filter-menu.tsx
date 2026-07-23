"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
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
          <SidebarMenuButton type="button" className="cursor-pointer">
            <Icon />
            <span>{item.label}</span>
            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            <span className="sr-only">Toggle</span>
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
                    <Link
                      href={buildHref(option.value)}
                      className="flex justify-between"
                    >
                      <span>{option.label}</span>
                      <span>{`(${option.count})`}</span>
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
