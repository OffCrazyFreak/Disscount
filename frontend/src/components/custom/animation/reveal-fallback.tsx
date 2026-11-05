import { ReactNode } from "react";

import type {
  RevealContainerTag,
  RevealItemTag,
} from "@/components/custom/animation/reveal-elements";

interface IRevealFallbackProps {
  as: RevealContainerTag;
  itemAs: RevealItemTag;
  className?: string;
  items: ReactNode[];
}

/** The same structure as a reveal, without the motion, for reduced-motion users. */
export default function RevealFallback({
  as: Fallback,
  itemAs: FallbackItem,
  className,
  items,
}: IRevealFallbackProps) {
  return (
    <Fallback className={className}>
      {items.map((child, index) => (
        <FallbackItem key={index}>{child}</FallbackItem>
      ))}
    </Fallback>
  );
}
