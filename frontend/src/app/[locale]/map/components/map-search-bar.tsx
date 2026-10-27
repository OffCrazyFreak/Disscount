"use client";

import { ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

import HeaderActions from "@/components/custom/header/components/header-actions";
import MapSearch from "@/app/[locale]/map/components/map-search";
import MapSearchLead from "@/app/[locale]/map/components/map-search-lead";
import MapSearchSurface from "@/app/[locale]/map/components/map-search-surface";
import { useMorphTransition } from "@/app/[locale]/map/hooks/use-morph-transition";
import { cn } from "@/lib/utils";

interface IMapSearchBarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The filters and the list, shown once the bar has opened. */
  children: ReactNode;
}

/**
 * The phone map's header: a floating bar that grows into the full-screen
 * search when the field is pressed, and shrinks back on the back arrow.
 */
export default function MapSearchBar({
  isOpen,
  onOpenChange,
  children,
}: IMapSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useMorphTransition(isOpen);

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
    <div
      className="pointer-events-none absolute inset-0 z-[3]"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !isOpen) return;

        // The store sheet listens for Escape too, and must stay open.
        event.stopPropagation();
        close(true);
      }}
    >
      <MapSearchSurface isOpen={isOpen} transition={transition} />

      <div
        className={cn(
          "pointer-events-auto absolute inset-x-5 top-5 flex h-14 items-center gap-2 rounded-2xl border px-2 transition-colors duration-200",
          isOpen && "border-transparent",
        )}
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
            with it instead of jumping. */}
        <motion.div
          inert={isOpen}
          className="flex shrink-0 justify-end overflow-hidden"
          initial={false}
          animate={{
            width: isOpen ? 0 : "auto",
            opacity: isOpen ? 0 : 1,
            x: isOpen ? 24 : 0,
          }}
          transition={transition}
        >
          <HeaderActions compact />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            className="pointer-events-auto absolute inset-x-0 top-19 bottom-0 flex flex-col"
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
