"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/custom/pwa/use-install-prompt";
import InstallInstructionsSheet from "@/components/custom/pwa/install-instructions-sheet";
import {
  isInstallBannerSnoozed,
  snoozeInstallBanner,
} from "@/utils/browser/local-storage";

// One-time dismissible banner inviting first-time visitors to add the app to
// their home screen (only on browsers that support installation).
export default function InstallBanner() {
  const { canShowInstallUI, canInstall, isIOS, promptInstall } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    // Read the persisted snooze on the client to avoid a hydration mismatch.
    setDismissed(isInstallBannerSnoozed());
  }, []);

  function handleDismiss() {
    setDismissed(true);
    snoozeInstallBanner();
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
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              alt="Disscount"
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-lg"
            />

            <p className="min-w-0 flex-1 text-sm leading-tight">
              Dodaj Disscount na početni zaslon za brži pristup.
            </p>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              aria-label="Zatvori"
              className="-mr-1 -mt-1 shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>

          <Button size="sm" className="w-full" onClick={handleInstall}>
            <Plus className="size-4" />
            Dodaj na početni zaslon
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
