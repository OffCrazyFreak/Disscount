import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import { JSX } from "react";

export default function Loading(): JSX.Element {
  return (
    <div className="grid place-items-center h-[70dvh]">
      <BlockLoadingSpinner size={96} />
    </div>
  );
}
