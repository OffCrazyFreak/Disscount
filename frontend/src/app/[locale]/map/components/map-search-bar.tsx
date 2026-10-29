"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import HeaderActions from "@/components/custom/header/components/header-actions";
import MapSearch from "@/app/[locale]/map/components/map-search";
import MapSearchLead from "@/app/[locale]/map/components/map-search-lead";
import MapSearchSurface from "@/app/[locale]/map/components/map-search-surface";
import { useHeaderSlot } from "@/app/[locale]/map/hooks/use-header-slot";
import { useMorphTransition } from "@/app/[locale]/map/hooks/use-morph-transition";
import { HEADER_SLOT_OPEN_ATTR } from "@/components/custom/header/header-slot";

interface IMapSearchBarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The filters and the list, shown once the bar has opened. */
  children: ReactNode;
}

/**
 * The phone map's search, shown inside the shared header, growing into the
 * full-screen search when the field is pressed and shrinking back on the
 * back arrow. Events from the portalled row still bubble to this tree.
 */
export default function MapSearchBar({
  isOpen,
  onOpenChange,
  children,
}: IMapSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useMorphTransition(isOpen);
  const { slot, frame } = useHeaderSlot();

  // Set when a keyboard closes the search, so focus returns to the field;
  // on a touch screen that would raise the keyboard again, so it blurs.
  const keepFocus = useRef(false);

  useEffect(() => {
    if (isOpen) return;

    if (keepFocus.current) inputRef.current?.focus({ preventScroll: true });
    else inputRef.current?.blur();
    keepFocus.current = false;
  }, [isOpen]);

  function close(byKeyboard: boolean) {
    keepFocus.current = byKeyboard;
    onOpenChange(false);
  }

  return (
    // Fixed, so the open list escapes the layout's clip and runs under the bottom nav.
    <div
      className="pointer-events-none fixed inset-0 z-[3]"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isOpen) return;

        // The store sheet listens for Escape too, and must stay open.
        event.stopPropagation();
        close(true);
      }}
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
              onBack={(byKeyboard) => close(byKeyboard)}
              transition={transition}
            />

            {/* The same field throughout: iOS raises the keyboard only for an input
                focused within the tap. Opened on press as well as focus, because an
                open store sheet traps focus (vaul never tells Radix it is
                non-modal), and closing it on press frees the field in time. */}
            <div
              className="min-w-0 flex-1"
              onPointerDown={(event) => {
                // The clear button empties the search without leaving the map.
                if (
                  event.target instanceof Element &&
                  event.target.closest("button")
                ) {
                  return;
                }
                onOpenChange(true);
              }}
              onFocus={(event) => {
                // Focus handed back on close, or on or from the clear button, stays put.
                if (keepFocus.current) return;
                if (event.currentTarget.contains(event.relatedTarget)) return;
                if (
                  event.target instanceof Element &&
                  event.target.closest("button")
                )
                  return;
                onOpenChange(true);
              }}
            >
              <MapSearch inputRef={inputRef} />
            </div>

            {/* Its width shrinks rather than it unmounting, so the field widens
                with it instead of jumping. The gap rides inside it, so the
                field reaches the row's end once it has shrunk. */}
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
