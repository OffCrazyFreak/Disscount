"use client";

import { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import { toUserMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils";

interface IErrorStateProps {
  /** The thrown value. Turned into copy by toUserMessage, never shown raw. */
  error?: unknown;
  title?: string;
  /** Shown when the error carries no message of its own. */
  fallbackMessage?: string;
  icon?: ReactNode;
  /** Retry, or a way back. Rendered under the message. */
  action?: ReactNode;
  className?: string;
}

/**
 * The failed branch of every async section, so a failure reads the same
 * everywhere instead of each page inventing its own red text.
 */
export default function ErrorState({
  error,
  title = "Nešto je pošlo po zlu",
  fallbackMessage = "Podatke trenutačno nije moguće učitati. Pokušaj ponovno.",
  icon,
  action,
  className,
}: IErrorStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center py-12 text-center", className)}
      role="alert"
    >
      {icon ?? (
        <TriangleAlert
          aria-hidden="true"
          className="size-12 text-muted-foreground mb-4"
        />
      )}

      <h3 className="text-lg font-semibold text-foreground mb-2 text-pretty">
        {title}
      </h3>

      <p className="max-w-md text-pretty text-gray-600">
        {toUserMessage(error, fallbackMessage)}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
