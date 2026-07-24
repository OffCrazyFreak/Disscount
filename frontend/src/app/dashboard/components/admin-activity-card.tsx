"use client";

import { useState } from "react";

import LabeledSelect from "@/components/custom/common/labeled-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDto } from "@/lib/api/schemas/auth-user";
import {
  ACTIVITY_WINDOW_OPTIONS,
  countActiveUsers,
  type ActivityWindowDays,
} from "@/app/dashboard/utils/user-activity";

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
  const [windowDays, setWindowDays] = useState(defaultWindowDays);
  const isDefaultWindow = windowDays === defaultWindowDays;

  return (
    <Card className="gap-4 py-6">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {isDefaultWindow ? (
            <>
              {title}{" "}
              <span className="text-muted-foreground/70">({abbreviation})</span>
            </>
          ) : (
            "Aktivni korisnici"
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-10 w-20" />}

        {isError && (
          <p className="text-destructive text-sm">
            Greška pri dohvaćanju korisnika.
          </p>
        )}

        {!isLoading && !isError && (
          <p className="text-primary text-4xl font-bold tabular-nums">
            {countActiveUsers(users, windowDays)}
          </p>
        )}

        <LabeledSelect
          label="Razdoblje:"
          value={windowDays}
          onValueChange={setWindowDays}
          options={ACTIVITY_WINDOW_OPTIONS}
          className="justify-start"
        />
      </CardContent>
    </Card>
  );
}
