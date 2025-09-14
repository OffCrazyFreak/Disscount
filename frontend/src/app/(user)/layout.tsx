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

export default function UserInventoryLayout({ children }: Props) {
  return <div className="max-w-3xl mx-auto">{children}</div>;
}
