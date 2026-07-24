"use client";

import { useState } from "react";

import LabeledSelect from "@/components/custom/common/labeled-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDto } from "@/lib/api/types";
import {
  ACTIVITY_WINDOW_OPTIONS,
  countActiveUsers,
} from "@/app/dashboard/utils/user-activity";

interface IAdminActivityCardProps {
  title: string;
  abbreviation: string;
  defaultWindowDays: string;
  users: UserDto[] | undefined;
}

/** One active-user counter over a trailing window the admin picks. */
export default function AdminActivityCard({
  title,
  abbreviation,
  defaultWindowDays,
  users,
}: IAdminActivityCardProps) {
  const [windowDays, setWindowDays] = useState(defaultWindowDays);

  return (
    <Card className="gap-4 py-6">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}{" "}
          <span className="text-muted-foreground/70">({abbreviation})</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-primary text-4xl font-bold tabular-nums">
          {countActiveUsers(users, windowDays)}
        </p>

        <LabeledSelect
          label="Razdoblje:"
          value={windowDays}
          onValueChange={setWindowDays}
          options={ACTIVITY_WINDOW_OPTIONS}
        />
      </CardContent>
    </Card>
  );
}
