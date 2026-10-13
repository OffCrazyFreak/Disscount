"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import LabeledSelect from "@/components/custom/common/labeled-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDto } from "@/lib/api/schemas/auth-user";
import {
  ACTIVITY_WINDOW_VALUES,
  countActiveUsers,
  type ActivityWindowDays,
} from "@/app/[locale]/dashboard/utils/user-activity";

interface IAdminActivityCardProps {
  title: string;
  abbreviation: string;
  defaultWindowDays: ActivityWindowDays;
  users: UserDto[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

/** One active-user counter over a trailing window the admin picks. */
export default function AdminActivityCard({
  title,
  abbreviation,
  defaultWindowDays,
  users,
  isLoading,
  isError,
}: IAdminActivityCardProps) {
  const t = useTranslations("dashboard");
  const [windowDays, setWindowDays] = useState(defaultWindowDays);
  const isDefaultWindow = windowDays === defaultWindowDays;

  return (
    <Card className="gap-4 py-6">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {isDefaultWindow ? (
            <>
              {title}{" "}
              <span className="text-muted-foreground/70">
                {t("activity.abbreviation", { abbreviation })}
              </span>
            </>
          ) : (
            t("activity.title")
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-10 w-20" />}

        {isError && (
          <p className="text-destructive text-sm">{t("activity.error")}</p>
        )}

        {!isLoading && !isError && (
          <p className="text-primary text-4xl font-bold tabular-nums">
            {countActiveUsers(users, windowDays)}
          </p>
        )}

        <LabeledSelect
          label={t("activity.windowLabel")}
          value={windowDays}
          onValueChange={setWindowDays}
          options={ACTIVITY_WINDOW_VALUES.map((value) => ({
            value,
            label: t(`activity.window.d${value}`),
          }))}
          className="justify-start"
        />
      </CardContent>
    </Card>
  );
}
