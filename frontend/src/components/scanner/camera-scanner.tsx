"use client";

import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { focusSidebarTrigger } from "@/components/ui/sidebar";
import ScannerContent from "@/components/scanner/scanner-content";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";

interface ICameraScannerProps {
  isOpen: boolean;
  preset: ScanPreset;
  confirm: boolean;
  onClose: () => void;
  onScan: (code: IScannedCode) => void;
}

export default function CameraScanner({
  isOpen,
  preset,
  confirm,
  onClose,
  onScan,
}: ICameraScannerProps) {
  const openerRef = useRef<Element | null>(null);
  const openerFieldRef = useRef<HTMLElement | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Content unmounts on close, so every open starts at the camera step. */}
      <DialogContent
        onOpenAutoFocus={() => {
          // Fires before Radix moves focus in, so this is still the opener.
          openerRef.current = document.activeElement;
          openerFieldRef.current =
            openerRef.current?.closest<HTMLElement>(
              "[data-slot=search-field]",
            ) ?? null;
        }}
        onCloseAutoFocus={(event) => {
          // Radix only restores focus to a DialogTrigger, and the scanner has none.
          event.preventDefault();

          // A scan closes the sidebar it started in, which leaves focus nowhere to go back to.
          if (openerRef.current?.closest("[inert]")) {
            focusSidebarTrigger();
            return;
          }

          // The scan button can be gone by now (the page re-rendered), but its field may remain.
          const searchInput = openerFieldRef.current?.querySelector("input");

          for (const target of [openerRef.current, searchInput]) {
            if (!(target instanceof HTMLElement) || !target.isConnected)
              continue;

            target.focus();
            if (document.activeElement === target) return;
          }
        }}
      >
        <ScannerContent preset={preset} confirm={confirm} onScan={onScan} />
      </DialogContent>
    </Dialog>
  );
}
