"use client";

import { motion } from "motion/react";

const CORNERS = [
  "top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl",
  "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl",
  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl",
  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl",
];

interface IScanOverlayProps {
  showScanLine?: boolean;
  dim?: boolean;
}

export default function ScanOverlay({
  showScanLine = false,
  dim = false,
}: IScanOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div
        className={`relative aspect-square w-3/5 max-w-64 rounded-3xl ${
          dim ? "shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" : ""
        }`}
      >
        {CORNERS.map((corner) => (
          <span
            key={corner}
            className={`absolute size-10 border-primary ${corner}`}
          />
        ))}

        {showScanLine && (
          <motion.div
            className="absolute right-4 left-4 h-0.5 rounded-full bg-primary shadow-[0_0_12px_3px] shadow-primary/60"
            animate={{ top: ["8%", "90%", "8%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}
