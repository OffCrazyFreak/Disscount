"use client";

import { useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCameraScanner } from "@/context/scanner-context";
import { useNotifications } from "@/context/notifications-context";
import type { IScannedCode } from "@/typings/scanned-code";

interface IFeatureCardActionProps {
  action: "scanner" | "notifications";
  className?: string;
  children: ReactNode;
}

// Client boundary for feature cards that trigger an action rather than navigate.
// Receives only serializable props + server-rendered children, so the card and
// its icon stay server-rendered.
export default function FeatureCardAction({
  action,
  className,
  children,
}: IFeatureCardActionProps) {
  const { openScanner } = useCameraScanner();
  const { setMenuOpen } = useNotifications();
  const router = useRouter();

  const handleScan = useCallback(
    (code: IScannedCode) => {
      const value = code.rawValue.trim();
      if (value) router.push(`/products/${encodeURIComponent(value)}`);
    },
    [router],
  );

  const onClick =
    action === "scanner"
      ? () => openScanner({ onScan: handleScan })
      : () => setMenuOpen(true);

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
