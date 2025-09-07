import React from "react";
import { ViewMode } from "@/typings/view-mode";
import ViewSwitcher from "@/components/custom/view-switcher";

type Props = {
  title?: React.ReactNode;
  search?: React.ReactNode;
  viewMode?: ViewMode;
  setViewMode?: (v: ViewMode) => void;
  children?: React.ReactNode;
  className?: string;
};

export default function UserInventoryLayout({
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
        <div className="flex items-center justify-between gap-4 my-6">
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
