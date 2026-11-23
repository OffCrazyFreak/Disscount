"use client";

import { motion, Transition } from "motion/react";

import HeaderActions from "@/components/custom/header/components/header-actions";
import MapSearch from "@/app/[locale]/map/components/map-search";
import MapSearchLead from "@/app/[locale]/map/components/map-search-lead";
import { useSearchOpener } from "@/app/[locale]/map/hooks/use-search-opener";
import { HEADER_SLOT_OPEN_ATTR } from "@/components/custom/header/header-slot";

interface IMapSearchFieldProps {
  isOpen: boolean;
  /** Phones put the menu and the account actions beside the field, since it replaces the page header there. */
  isInHeader: boolean;
  opener: ReturnType<typeof useSearchOpener>;
  transition: Transition;
}

export default function MapSearchField({
  isOpen,
  isInHeader,
  opener,
  transition,
}: IMapSearchFieldProps) {
  const { close, fieldProps, inputRef } = opener;

  return (
    <div
      {...{ [HEADER_SLOT_OPEN_ATTR]: isOpen || undefined }}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <MapSearchLead
        isOpen={isOpen}
        hasMenu={isInHeader}
        onBack={close}
        transition={transition}
      />

      {/* One field because iOS raises the keyboard only for an input focused within the tap. */}
      <div className="min-w-0 flex-1" {...fieldProps}>
        <MapSearch inputRef={inputRef} />
      </div>

      {/* Its width shrinks rather than it unmounting, so the field widens with it instead of jumping. */}
      {isInHeader && (
        <motion.div
          inert={isOpen}
          className="-ml-2 flex shrink-0 justify-end overflow-hidden"
          initial={false}
          animate={{
            width: isOpen ? 0 : "auto",
            opacity: isOpen ? 0 : 1,
            x: isOpen ? 24 : 0,
          }}
          transition={transition}
        >
          <div className="pl-2">
            <HeaderActions compact />
          </div>
        </motion.div>
      )}
    </div>
  );
}
