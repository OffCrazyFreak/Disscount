"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleAlert, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/custom/common/banner";
import { useInstallPrompt } from "@/components/custom/pwa/use-install-prompt";
import InstallInstructionsSheet from "@/components/custom/pwa/install-instructions-sheet";
import { cn } from "@/lib/utils";

interface IInstallCardProps {
  /** Always shown once ready, rather than only when the prompt is available. */
  permanent?: boolean;
}

/**
 * The install card, in the sidebar and on the landing page.
 *
 * There is no unsupported state: beforeinstallprompt is Chromium-only, so
 * claiming a browser was unsupported was wrong for macOS Safari and Firefox on
 * Android, both of which install through their own menus. Everything without a
 * native prompt falls through to the manual instructions instead.
 */
export default function InstallCard({ permanent = false }: IInstallCardProps) {
  const {
    canShowInstallUI,
    canPromoteInstall,
    showUnsupportedNotice,
    canInstall,
    isIOS,
    isMacSafari,
    promptInstall,
  } = useInstallPrompt();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // The landing page promises the app is installable, so it owes an explanation
  // where it is not. The sidebar just stays quiet.
  if (permanent && showUnsupportedNotice) {
    return (
      <Banner
        variant="primarySoft"
        size="lg"
        icon={CircleAlert}
        title="Ovaj preglednik ne podržava instalaciju"
        text="Otvori Disscount u drugom pregledniku, npr. Google Chromeu, da ga dodaš na uređaj."
        className="mb-0"
      />
    );
  }

  const shouldShow = permanent ? canPromoteInstall : canShowInstallUI;

  if (!shouldShow) return null;

  async function handleInstall() {
    if (canInstall) {
      await promptInstall();
      return;
    }

    setInstructionsOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 border bg-card p-3",
          permanent ? "rounded-xl shadow-lg" : "rounded-lg",
        )}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/brand/icons/icon-192.png"
            alt="Disscount"
            width={permanent ? 48 : 40}
            height={permanent ? 48 : 40}
            className={cn(
              "shrink-0 rounded-lg",
              permanent ? "size-12" : "size-10",
            )}
          />

          <p
            className={cn(
              "min-w-0 flex-1 text-sm leading-tight",
              !permanent && "text-muted-foreground",
            )}
          >
            Dodaj Disscount na početni zaslon za brži pristup.
          </p>
        </div>

        <Button className="w-full" onClick={handleInstall}>
          <Plus aria-hidden="true" className="size-4" />
          Dodaj na početni zaslon
        </Button>
      </div>

      <InstallInstructionsSheet
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        isIOS={isIOS}
        isMacSafari={isMacSafari}
      />
    </>
  );
}
