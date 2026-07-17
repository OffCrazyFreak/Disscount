import type { LucideIcon } from "lucide-react";

export interface IFabAction {
  icon: LucideIcon;
  /** Stable name for the action; never interpolate a live count into it */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}
