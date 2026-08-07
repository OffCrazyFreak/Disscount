"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ICopyButtonProps {
  value: string;
  /** Accessible name and, when shown, the tooltip. Name what is copied, not "Kopiraj". */
  label: string;
  successMessage: string;
  errorMessage?: string;
  className?: string;
}

const CONFIRMED_MS = 2000;

/** Ghost icon button that copies `value` to the clipboard and confirms it. */
export default function CopyButton({
  value,
  label,
  successMessage,
  errorMessage = "Greška pri kopiranju",
  className,
}: ICopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      // The toast announces it; the icon swap is for anyone who is looking rather
      // than listening.
      toast.success(successMessage);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), CONFIRMED_MS);
    } catch {
      toast.error(errorMessage);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn("shrink-0", className)}
      onClick={handleCopy}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </Button>
  );
}
