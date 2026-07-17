"use client";

import { motion } from "motion/react";

const CORNERS = [
  "top-0 left-0 border-t-4 border-l-4",
  "top-0 right-0 border-t-4 border-r-4",
  "bottom-0 left-0 border-b-4 border-l-4",
  "bottom-0 right-0 border-b-4 border-r-4",
];

interface IScanOverlayProps {
  showScanLine?: boolean;
  showFrame?: boolean;
}

export default function ScanOverlay({
  showScanLine = false,
  showFrame = true,
}: IScanOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="relative aspect-square w-[70%]">
        {showFrame && (
          <div className="absolute inset-0 border-2 border-dashed border-primary/40" />
        )}

        {showFrame &&
          CORNERS.map((corner) => (
            <span
              key={corner}
              className={`absolute h-[15%] w-[15%] border-primary ${corner}`}
            />
          ))}

        {showScanLine && (
          <motion.div
            className="absolute right-[6%] left-[6%] h-0.5 rounded-full bg-primary shadow-[0_0_12px_3px] shadow-primary/60"
            animate={{ top: ["6%", "92%", "6%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}
