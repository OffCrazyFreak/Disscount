"use client";

import { motion } from "motion/react";

// Replica of the library finder (centered square at 70% width, dashed box +
// L-shaped corner brackets) in the app primary color, plus an animated scan
// line. The native frame is hidden via scanner.css.
const CORNERS = [
  "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
  "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
];

export default function ScanOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="relative aspect-square w-[70%]">
        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary/40" />

        {CORNERS.map((corner) => (
          <span
            key={corner}
            className={`absolute h-[15%] w-[15%] border-primary ${corner}`}
          />
        ))}

        <motion.div
          className="absolute right-[6%] left-[6%] h-0.5 rounded-full bg-primary shadow-[0_0_12px_3px] shadow-primary/60"
          animate={{ top: ["6%", "92%", "6%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
