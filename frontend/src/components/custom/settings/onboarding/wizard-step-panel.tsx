"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface IWizardStepPanelProps {
  stepId: string;
  direction: 1 | -1;
  children: ReactNode;
}

// Directional slide between wizard steps; plain crossfade under reduced motion.
export default function WizardStepPanel({
  stepId,
  direction,
  children,
}: IWizardStepPanelProps) {
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : direction * 40;

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      <motion.div
        key={stepId}
        initial={{ opacity: 0, x: offset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -offset }}
        transition={
          reduceMotion
            ? { duration: 0.18 }
            : { type: "spring", stiffness: 320, damping: 30 }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
