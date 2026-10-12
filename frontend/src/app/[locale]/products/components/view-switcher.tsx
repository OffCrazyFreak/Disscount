// TODO(#61): parked until list views become user-personalisable, not dead. Call
// site is commented out in products-client.tsx, and /digital-cards needs one too.
// Unparking means taking useViewMode's setter, which has no callers until then.
import { Grid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ViewMode } from "@/typings/view-mode";

interface IViewSwitcherProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ViewSwitcher({
  viewMode,
  setViewMode,
}: IViewSwitcherProps) {
  const t = useTranslations("products");

  return (
    <TooltipProvider>
      <div
        role="radiogroup"
        aria-label={t("viewSwitcher.label")}
        className="bg-muted inline-flex items-center rounded-lg p-1"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              data-state={viewMode === "grid" ? "active" : "inactive"}
              className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground rounded-sm p-2 transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none"
            >
              <input
                className="sr-only"
                type="radio"
                name="view-mode"
                value="grid"
                checked={viewMode === "grid"}
                onChange={() => setViewMode("grid")}
                aria-label={t("viewSwitcher.grid")}
              />
              <Grid size={18} />
            </label>
          </TooltipTrigger>
          <TooltipContent>{t("viewSwitcher.grid")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <label
              data-state={viewMode === "list" ? "active" : "inactive"}
              className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground rounded-sm p-2 transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none"
            >
              <input
                className="sr-only"
                type="radio"
                name="view-mode"
                value="list"
                checked={viewMode === "list"}
                onChange={() => setViewMode("list")}
                aria-label={t("viewSwitcher.list")}
              />
              <List size={18} />
            </label>
          </TooltipTrigger>
          <TooltipContent>{t("viewSwitcher.list")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
