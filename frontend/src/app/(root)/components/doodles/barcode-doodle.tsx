"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";

interface IBarcodeDoodleProps {
  className?: string;
}

const bars: Array<{ x: number; height: number; width: number }> = [
  { x: 8, height: 28, width: 3 },
  { x: 14, height: 22, width: 2 },
  { x: 19, height: 28, width: 4 },
  { x: 26, height: 24, width: 2 },
  { x: 31, height: 28, width: 3 },
  { x: 37, height: 21, width: 2 },
  { x: 42, height: 28, width: 4 },
  { x: 49, height: 24, width: 2 },
  { x: 54, height: 28, width: 3 },
];

// Barcode: bars draw in staggered, then a red scanline sweeps up and down.
export default function BarcodeDoodle({ className }: IBarcodeDoodleProps) {
  return (
    <DoodleCanvas viewBox="0 0 64 40" className={className}>
      {bars.map((bar, index) => (
        <motion.line
          key={bar.x}
          x1={bar.x}
          x2={bar.x}
          y1={20 - bar.height / 2}
          y2={20 + bar.height / 2}
          strokeWidth={bar.width}
          variants={drawVariants(index * 0.08)}
        />
      ))}
      <g
        className="animate-dis-scanline"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <line x1="4" x2="60" y1="20" y2="20" className="stroke-destructive" />
      </g>
    </DoodleCanvas>
  );
}
