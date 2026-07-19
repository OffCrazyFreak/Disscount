"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
  popVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";

interface IPriceTagDoodleProps {
  className?: string;
}

// Hanging price tag with a % sign: outline draws, then the % pops in and the
// whole tag swings once around its string hole.
export default function PriceTagDoodle({ className }: IPriceTagDoodleProps) {
  return (
    <DoodleCanvas viewBox="0 0 64 64" className={className}>
      <motion.g
        style={{ originX: "17px", originY: "15px" }}
        variants={{
          hidden: { rotate: 0 },
          visible: {
            rotate: [0, -10, 7, -4, 0],
            transition: { duration: 1.6, delay: 0.9, ease: "easeInOut" },
          },
        }}
      >
        <motion.path
          d="M9.5 12.5c0-2.8 2.2-5 5-5h13.8c1.3 0 2.6.5 3.5 1.5l22 22.2c2 2 1.9 5.2-.1 7.1L40 51.8c-2 1.9-5.1 1.9-7-.1L10.9 29.4c-.9-.9-1.4-2.2-1.4-3.5V12.5z"
          variants={drawVariants()}
        />
        <motion.circle cx="17" cy="15" r="3" variants={drawVariants(0.5)} />
        <motion.g variants={popVariants(1)}>
          <circle cx="27" cy="30" r="3.2" />
          <circle cx="41" cy="42" r="3.2" />
          <path d="M42.5 27.5 25.5 44.5" />
        </motion.g>
      </motion.g>
    </DoodleCanvas>
  );
}
