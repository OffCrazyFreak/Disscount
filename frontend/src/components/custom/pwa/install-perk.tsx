"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/custom/pwa/use-install-prompt";
import InstallInstructionsSheet from "@/components/custom/pwa/install-instructions-sheet";

/**
 * The landing page's "install as an app" perk row. A button wherever an install
 * is possible, whether that is a native prompt or the browser's own menu, and
 * plain copy for the frame before client detection has run.
 */
export default function InstallPerk() {
  const { ready, isIOS, canPromoteInstall, promptInstall, canInstall } =
    useInstallPrompt();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // Nothing to advertise to someone already running the installed app, or to
  // someone inside a webview that has nowhere to install it.
  if (ready && !canPromoteInstall) return null;

  const content = (
    <>
      <span className="size-11 md:size-16 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary">
        <MonitorSmartphone aria-hidden="true" className="size-6 md:size-8" />
      </span>

      <span className="block min-w-0 flex-1 space-y-1">
        <span className="block font-semibold text-pretty">
          Instaliraj kao aplikaciju
        </span>
        <span className="block text-sm font-normal text-muted-foreground text-pretty">
          Bez trgovine aplikacija - dodaj Disscount na početni zaslon izravno iz
          preglednika.
        </span>
      </span>
    </>
  );

  if (!ready) return <div className="flex items-center gap-4">{content}</div>;

  async function handleInstall() {
    if (canInstall) {
      await promptInstall();
      return;
    }

    setInstructionsOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-start gap-4 whitespace-normal p-0 text-left"
        onClick={handleInstall}
      >
        {content}
      </Button>

      <InstallInstructionsSheet
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        isIOS={isIOS}
      />
    </>
  );
}
