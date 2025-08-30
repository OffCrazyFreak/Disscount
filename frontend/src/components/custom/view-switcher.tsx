import { Grid, List } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ViewMode } from "@/typings/view-mode";

interface ViewSwitcherProps {
  value?: ViewMode;
  onChange?: (value: ViewMode) => void;
  className?: string;
}

export default function ViewSwitcher({
  value = "list",
  onChange,
  className,
}: ViewSwitcherProps) {
  return (
    <div className={className ?? ""}>
      <TooltipProvider>
        <div
          role="radiogroup"
          aria-label="View mode"
          className="bg-muted inline-flex items-center rounded-lg p-1"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                data-state={value === "grid" ? "active" : "inactive"}
                className="data-[state=active]:bg-primary data-[state=active]:text-white text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground rounded-sm p-2 transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none"
                aria-pressed={value === "grid"}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="view-mode"
                  value="grid"
                  checked={value === "grid"}
                  onChange={() => onChange?.("grid")}
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
                data-state={value === "list" ? "active" : "inactive"}
                className="data-[state=active]:bg-primary data-[state=active]:text-white text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground rounded-sm p-2 transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none"
                aria-pressed={value === "list"}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="view-mode"
                  value="list"
                  checked={value === "list"}
                  onChange={() => onChange?.("list")}
                  aria-label="List view"
                />
                <List size={18} />
              </label>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
