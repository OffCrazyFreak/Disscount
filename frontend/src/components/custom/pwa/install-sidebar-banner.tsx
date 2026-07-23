"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/custom/pwa/use-install-prompt";
import InstallInstructionsSheet from "@/components/custom/pwa/install-instructions-sheet";

// Persistent counterpart to InstallBanner, shown on capable browsers until the app is installed.
export default function InstallSidebarBanner() {
  const { canShowInstallUI, canInstall, isIOS, promptInstall } =
    useInstallPrompt();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  if (!canShowInstallUI) return null;

  async function handleInstall() {
    if (canInstall) {
      await promptInstall();
      return;
    }

    setInstructionsOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/icons/icon-192.png"
            alt="Disscount"
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-lg"
          />

          <p className="min-w-0 flex-1 text-sm leading-tight text-muted-foreground">
            Dodaj Disscount na početni zaslon za brži pristup.
          </p>
        </div>

        <Button size="sm" className="w-full" onClick={handleInstall}>
          <Plus className="size-4" />
          Dodaj na početni zaslon
        </Button>
      </div>

      <InstallInstructionsSheet
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        isIOS={isIOS}
      />
    </>
  );
}
