"use client";

import { Children, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

interface IAnimatedGroupProps {
  children: ReactNode;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)", y: 20 },
  visible: { opacity: 1, filter: "blur(0px)", y: 0 },
};

function AnimatedGroup({ children, className }: IAnimatedGroupProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { AnimatedGroup };
