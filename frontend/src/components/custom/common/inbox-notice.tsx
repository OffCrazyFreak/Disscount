"use client";

import { useEffect, useRef } from "react";
import { MailCheck } from "lucide-react";

interface IInboxNoticeProps {
  title: string;
  description: string;
  email?: string;
}

/**
 * Worded so it never reveals whether the address has an account.
 *
 * Owns its own live region and focus handling, because every call site replaces
 * a submitted form with it: without them a screen-reader user hears nothing and
 * focus falls to the body, since the button they just pressed has unmounted.
 */
export default function InboxNotice({
  title,
  description,
  email,
}: IInboxNoticeProps) {
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
      {/* Theme-aware pairing rather than a raw palette step: bg-green-100 stayed
          light in dark mode, and green-100 against --primary is about 2.1:1,
          under the 3:1 a meaningful graphic needs. */}
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck aria-hidden="true" className="size-6" />
      </div>

      <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground">{description}</p>

      {email && <p className="text-sm font-medium">{email}</p>}

      <p className="text-xs text-muted-foreground">
        Ne zaboravi provjeriti i spam / neželjenu poštu.
      </p>
    </div>
  );
}
