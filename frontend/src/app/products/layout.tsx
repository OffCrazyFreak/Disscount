import { ReactNode } from "react";
import { ViewMode } from "@/typings/view-mode";
import ViewSwitcher from "@/components/custom/view-switcher";

type Props = {
  title?: ReactNode;
  search?: ReactNode;
  viewMode?: ViewMode;
  setViewMode?: (v: ViewMode) => void;
  children?: ReactNode;
  className?: string;
};

export default function ProductsLayout({
  title,
  search,
  viewMode,
  setViewMode,
  children,
  className,
}: Props) {
  return (
    <div className={className ?? "max-w-3xl mx-auto"}>
      {search}

      <div className="my-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>{title}</div>

          {setViewMode && (
            <ViewSwitcher value={viewMode} onChange={setViewMode} />
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
