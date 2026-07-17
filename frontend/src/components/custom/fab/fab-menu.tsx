"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IFabAction } from "@/components/custom/fab/fab-action";

interface IFabMenuProps {
  actions: IFabAction[];
  label?: string;
  /** Applied to the fixed container, which never joins the page's layout */
  className?: string;
}

/**
 * A FAB that expands into its actions, each with a visible label. The labels
 * are not tooltips on purpose: this is a touch-only control, and a tooltip
 * never opens without a hover.
 */
export default function FabMenu({
  actions,
  label = "Radnje",
  className,
}: IFabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  function runAction(action: IFabAction) {
    setIsOpen(false);
    action.onClick();
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="Zatvori izbornik"
            onClick={() => setIsOpen(false)}
            className={cn(
              "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]",
              className,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6",
          className,
        )}
      >
        <AnimatePresence>
          {isOpen &&
            actions.map((action, index) => (
              <motion.div
                key={action.label}
                className="pointer-events-auto flex items-center gap-2"
                initial={{ opacity: 0, y: 12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.8 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.18,
                  // Unfurls from the trigger outwards, so the nearest action
                  // leads however many there are.
                  delay: prefersReducedMotion
                    ? 0
                    : (actions.length - 1 - index) * 0.04,
                }}
              >
                <Badge className="shadow-md">{action.label}</Badge>

                <Button
                  type="button"
                  size="icon"
                  aria-label={action.label}
                  disabled={action.disabled}
                  onClick={() => runAction(action)}
                  className="size-12 rounded-full shadow-lg"
                >
                  {action.loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <action.icon className="size-5" />
                  )}
                </Button>
              </motion.div>
            ))}
        </AnimatePresence>

        <Button
          type="button"
          size="icon"
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="pointer-events-auto size-16 rounded-full shadow-lg"
        >
          {/* Larger than the action icons, so the trigger stays the anchor */}
          <Plus
            className={cn(
              "size-7 transition-transform duration-200 motion-reduce:transition-none",
              isOpen && "rotate-45",
            )}
          />
        </Button>
      </div>
    </>
  );
}
