"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "./use-install-prompt";
import InstallInstructionsSheet from "./install-instructions-sheet";
import {
  getInstallBannerDismissed,
  setInstallBannerDismissed,
} from "@/utils/browser/local-storage";

// One-time dismissible banner inviting first-time visitors to install the app.
export default function InstallBanner() {
  const { canShowInstallUI, canInstall, isIOS, promptInstall } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    // Read the persisted dismissal on the client to avoid a hydration mismatch.
    setDismissed(getInstallBannerDismissed());
  }, []);

  function handleDismiss() {
    setDismissed(true);
    setInstallBannerDismissed(true);
  }

  async function handleInstall() {
    if (canInstall) {
      await promptInstall();
      return;
    }

    setInstructionsOpen(true);
  }

  if (dismissed || !canShowInstallUI) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:inset-x-auto sm:right-4 sm:max-w-sm">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg">
          <Image
            src="/icons/icon-192.png"
            alt="Disscount"
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg"
          />

          <div className="min-w-0 flex-1">
            <p className="font-medium leading-tight">Instaliraj Disscount</p>
            <p className="text-sm leading-tight text-muted-foreground">
              Brži pristup s početnog zaslona.
            </p>
          </div>

          <Button size="sm" onClick={handleInstall}>
            <Download className="size-4" />
            Instaliraj
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            aria-label="Zatvori"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <InstallInstructionsSheet
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        isIOS={isIOS}
      />
    </>
  );
}
