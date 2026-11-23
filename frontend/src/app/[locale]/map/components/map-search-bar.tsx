"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import HeaderActions from "@/components/custom/header/components/header-actions";
import MapSearch from "@/app/[locale]/map/components/map-search";
import MapSearchLead from "@/app/[locale]/map/components/map-search-lead";
import MapSearchSurface from "@/app/[locale]/map/components/map-search-surface";
import { useHeaderSlot } from "@/app/[locale]/map/hooks/use-header-slot";
import { useMorphTransition } from "@/app/[locale]/map/hooks/use-morph-transition";
import { useSearchOpener } from "@/app/[locale]/map/hooks/use-search-opener";
import { HEADER_SLOT_OPEN_ATTR } from "@/components/custom/header/header-slot";

interface IMapSearchBarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The filters and the list, shown once the bar has opened. */
  children: ReactNode;
}

/** Events from the portalled row still bubble to this tree. */
export default function MapSearchBar({
  isOpen,
  onOpenChange,
  children,
}: IMapSearchBarProps) {
  const opener = useSearchOpener({ isOpen, onOpenChange });
  const transition = useMorphTransition(isOpen);
  const { slot, frame } = useHeaderSlot();

  return (
    // Fixed, so the open list escapes the layout's clip and runs under the bottom nav.
    <div
      className="pointer-events-none fixed inset-0 z-[3]"
      onKeyDown={opener.handleKeyDown}
    >
      <MapSearchSurface isOpen={isOpen} frame={frame} transition={transition} />

      {slot &&
        createPortal(
          <div
            {...{ [HEADER_SLOT_OPEN_ATTR]: isOpen || undefined }}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <MapSearchLead
              isOpen={isOpen}
              onBack={opener.close}
              transition={transition}
            />

            {/* One field because iOS raises the keyboard only for an input focused within the tap. */}
            <div className="min-w-0 flex-1" {...opener.fieldProps}>
              <MapSearch inputRef={opener.inputRef} />
            </div>

            {/* Its width shrinks rather than it unmounting, so the field widens with it instead of jumping. */}
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
          </div>,
          slot,
        )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col"
            style={{ top: frame?.bottom }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ ...transition, delay: transition.duration && 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
