"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface IMapLoadStateProps {
  status: "pending" | "error" | "success";
  onRetry: () => void;
}

/** Shown in the panel while the store list loads, or when it failed. */
export default function MapLoadState({ status, onRetry }: IMapLoadStateProps) {
  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 p-6 text-center text-sm"
      >
        <p>Trgovine se trenutačno ne mogu učitati.</p>

        <Button type="button" variant="outline" onClick={onRetry}>
          Pokušaj ponovno
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      Učitavam trgovine...
    </div>
  );
}
