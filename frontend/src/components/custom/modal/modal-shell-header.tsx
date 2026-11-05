"use client";

import { ReactNode } from "react";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnsavedIndicator } from "@/components/custom/modal/unsaved-indicator";
import { cn } from "@/lib/utils";

export interface IModalShellHeaderContent {
  title: ReactNode;
  description?: ReactNode;
  srOnlyDescription?: boolean;
  // Rendered above the title (e.g. a confirm dialog's icon badge).
  hero?: ReactNode;
  centered?: boolean;
  // Shows the amber "unsaved changes" marker next to the title.
  dirty?: boolean;
  headerExtra?: ReactNode;
}

interface IModalShellHeaderProps extends IModalShellHeaderContent {
  hasBody: boolean;
}

/** Separates the header's props from whatever else the shell was given. */
export function splitHeaderProps<T extends IModalShellHeaderContent>({
  title,
  description,
  srOnlyDescription,
  hero,
  centered,
  dirty,
  headerExtra,
  ...rest
}: T) {
  const header: IModalShellHeaderContent = {
    title,
    description,
    srOnlyDescription,
    hero,
    centered,
    dirty,
    headerExtra,
  };

  return { header, rest };
}

export default function ModalShellHeader({
  title,
  description,
  srOnlyDescription = false,
  hero,
  centered = false,
  dirty = false,
  headerExtra,
  hasBody,
}: IModalShellHeaderProps) {
  return (
    <DialogHeader
      className={cn(
        "gap-1.5 px-6 pt-6",
        // With a body, the body is the only flexible track, so a long list
        // or a large font size scrolls instead of squeezing the title and
        // the buttons out of shape.
        //
        // Without one (confirm, donation, auth-status) there is no such
        // track, and pinning both header and footer inside overflow-hidden
        // would clip the buttons away with nothing to scroll. So the header
        // takes that role instead and the footer stays reachable.
        hasBody ? "shrink-0" : "min-h-0 flex-1 overflow-y-auto",
        centered ? "items-center text-center sm:text-center" : "text-left",
      )}
    >
      {hero}
      <DialogTitle className="flex items-center gap-2 text-xl">
        {title}
        {dirty && <UnsavedIndicator />}
      </DialogTitle>
      {description && (
        <DialogDescription className={cn(srOnlyDescription && "sr-only")}>
          {description}
        </DialogDescription>
      )}
      {headerExtra}
    </DialogHeader>
  );
}
