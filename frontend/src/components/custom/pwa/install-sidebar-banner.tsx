"use client";

import { useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "./use-install-prompt";
import InstallInstructionsSheet from "./install-instructions-sheet";

// Persistent install banner pinned to the bottom of the sidebar. Stays visible
// while the app isn't installed; uses the native prompt when available and
// otherwise opens manual instructions.
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
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <Image
          src="/icons/icon-192.png"
          alt="Disscount"
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-lg"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">
            Instaliraj aplikaciju
          </p>
          <p className="text-xs leading-tight text-muted-foreground">
            Brži pristup s početnog zaslona.
          </p>
        </div>

        <Button size="sm" onClick={handleInstall}>
          <Download className="size-4" />
          Instaliraj
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
