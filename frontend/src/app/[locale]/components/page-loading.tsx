import BlockLoadingSpinner from "@/components/custom/common/feedback/block-loading-spinner";
import { JSX } from "react";

// Each segment re-exports this: a loading file on [locale] would stream a 200 before detail pages can call notFound().
export default function PageLoading(): JSX.Element {
  return (
    <div className="grid place-items-center h-[70dvh]">
      <BlockLoadingSpinner size={96} />
    </div>
  );
}
