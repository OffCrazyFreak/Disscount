import { Grid, List } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ViewSwitcherProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export default function ViewSwitcher({
  viewMode,
  setViewMode,
}: ViewSwitcherProps) {
  return (
    <TooltipProvider>
      <div
        role="radiogroup"
        aria-label="View mode"
        className="bg-muted inline-flex items-center rounded-lg p-1"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              data-state={viewMode === "grid" ? "active" : "inactive"}
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground rounded-sm p-2 transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none"
              aria-pressed={viewMode === "grid"}
            >
              <input
                className="sr-only"
                type="radio"
                name="view-mode"
                value="grid"
                checked={viewMode === "grid"}
                onChange={() => setViewMode("grid")}
                aria-label="Grid view"
              />
              <Grid size={18} />
            </label>
          </TooltipTrigger>
          <TooltipContent>Grid view</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <label
              data-state={viewMode === "list" ? "active" : "inactive"}
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground rounded-sm p-2 transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none"
              aria-pressed={viewMode === "list"}
            >
              <input
                className="sr-only"
                type="radio"
                name="view-mode"
                value="list"
                checked={viewMode === "list"}
                onChange={() => setViewMode("list")}
                aria-label="List view"
              />
              <List size={18} />
            </label>
          </TooltipTrigger>
          <TooltipContent>List view</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
