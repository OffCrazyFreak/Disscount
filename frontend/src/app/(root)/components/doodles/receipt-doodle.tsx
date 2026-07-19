"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";

interface IReceiptDoodleProps {
  className?: string;
}

const itemLines: Array<{ y: number; toX: number }> = [
  { y: 17, toX: 34 },
  { y: 25, toX: 29 },
  { y: 33, toX: 34 },
  { y: 41, toX: 26 },
];

// Receipt with a torn zigzag bottom: outline draws, then items "print" line
// by line and the total underlines itself last.
export default function ReceiptDoodle({ className }: IReceiptDoodleProps) {
  return (
    <DoodleCanvas viewBox="0 0 48 64" className={className}>
      <motion.path
        d="M8.5 4.5 c 10 -1.5 21 -1.5 31 0 V 57 l-3.9-2.9-4 2.9-3.8-2.9-3.9 2.9-3.9-2.9-3.9 2.9-3.8-2.9L8.5 57 V4.5z"
        variants={drawVariants()}
      />
      {itemLines.map((line, index) => (
        <motion.path
          key={line.y}
          d={`M14 ${line.y} c ${(line.toX - 14) / 2} 1, ${(line.toX - 14) / 2} -1, ${line.toX - 14} 0`}
          variants={drawVariants(0.7 + index * 0.15)}
        />
      ))}
      <motion.path
        d="M14 49 c 10 1.6, 10 -1.6, 20 0"
        strokeWidth="3.5"
        variants={drawVariants(1.4)}
      />
    </DoodleCanvas>
  );
}
