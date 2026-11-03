"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { OpenFilter } from "@/app/[locale]/map/utils/open-filter";

interface IMapOpenFilterProps {
  filter: OpenFilter;
  onChange: (filter: OpenFilter) => void;
  /** The hours failed or are paused offline, so the filter cannot keep anything out. */
  hasHoursFailed: boolean;
  onRetry: () => void;
}

/**
 * "Open now" keeps stores whose hours confirm they are open; the second
 * switch, offered only then, also keeps those nobody has confirmed.
 */
export default function MapOpenFilter({
  filter,
  onChange,
  hasHoursFailed,
  onRetry,
}: IMapOpenFilterProps) {
  const t = useTranslations("map");
  const isOn = filter !== "off";
  const isFailing = isOn && hasHoursFailed;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <label className="flex cursor-pointer items-center gap-2">
        <Switch
          checked={isOn}
          onCheckedChange={(checked) => onChange(checked ? "confirmed" : "off")}
        />
        {t("filters.openNow")}
      </label>

      {isOn && (
        <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
          <Switch
            checked={filter === "with-unconfirmed"}
            onCheckedChange={(checked) =>
              onChange(checked ? "with-unconfirmed" : "confirmed")
            }
          />
          {t("filters.includeUnconfirmed")}
        </label>
      )}

      {/* Always mounted, so the failure is announced when it appears. */}
      <p
        role="status"
        className={cn(
          "basis-full text-muted-foreground",
          !isFailing && "sr-only",
        )}
      >
        {isFailing && (
          <>
            {t("filters.hoursFailed")}{" "}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => onRetry()}
              className="h-auto p-0"
            >
              {t("load.retry")}
            </Button>
          </>
        )}
      </p>
    </div>
  );
}
