"use client";

import { useEffect, useRef } from "react";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface IInboxNoticeProps {
  title: string;
  description: string;
  email?: string;
}

/** Never reveals whether an account exists; owns focus and live region, as callers unmount the button. */
export default function InboxNotice({
  title,
  description,
  email,
}: IInboxNoticeProps) {
  const t = useTranslations("common");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 py-4 text-center"
    >
      {/* Theme-aware because bg-green-100 stays light in dark mode, about 2.1:1 against --primary. */}
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck aria-hidden="true" className="size-6" />
      </div>

      <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground">{description}</p>

      {email && <p className="text-sm font-medium">{email}</p>}

      <p className="text-xs text-muted-foreground">
        {t("inboxNotice.spamHint")}
      </p>
    </div>
  );
}
