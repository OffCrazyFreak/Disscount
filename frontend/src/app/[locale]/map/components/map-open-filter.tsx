"use client";

import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import type { OpenFilter } from "@/app/[locale]/map/utils/open-filter";

interface IMapOpenFilterProps {
  filter: OpenFilter;
  onChange: (filter: OpenFilter) => void;
}

/**
 * "Open now" keeps stores whose hours confirm they are open; the second
 * switch, offered only then, also keeps those nobody has confirmed.
 */
export default function MapOpenFilter({
  filter,
  onChange,
}: IMapOpenFilterProps) {
  const t = useTranslations("map.filters");
  const isOn = filter !== "off";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <label className="flex cursor-pointer items-center gap-2">
        <Switch
          checked={isOn}
          onCheckedChange={(checked) => onChange(checked ? "confirmed" : "off")}
        />
        {t("openNow")}
      </label>

      {isOn && (
        <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
          <Switch
            checked={filter === "with-unconfirmed"}
            onCheckedChange={(checked) =>
              onChange(checked ? "with-unconfirmed" : "confirmed")
            }
          />
          {t("includeUnconfirmed")}
        </label>
      )}
    </div>
  );
}
