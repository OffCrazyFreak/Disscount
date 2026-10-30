"use client";

import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, Transition } from "motion/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface IMapSearchLeadProps {
  isOpen: boolean;
  /** True when a key pressed it, so focus can go back to the field. */
  onBack: (byKeyboard: boolean) => void;
  transition: Transition;
}

/** The bar's first button: the menu, or the way back once the search is open. */
export default function MapSearchLead({
  isOpen,
  onBack,
  transition,
}: IMapSearchLeadProps) {
  const t = useTranslations("map.layout");

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {isOpen ? (
        <motion.div
          key="back"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={transition}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("backToMap")}
            // A keyboard press reports no clicks in event.detail.
            onClick={(event) => onBack(event.detail === 0)}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="menu"
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "-100%" }}
          transition={transition}
        >
          <SidebarTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
