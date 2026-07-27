"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleAlert, MonitorSmartphone, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/custom/common/banner";
import { useInstallPrompt } from "@/components/custom/pwa/use-install-prompt";
import InstallInstructionsSheet from "@/components/custom/pwa/install-instructions-sheet";
import { cn } from "@/lib/utils";

interface IInstallSidebarBannerProps {
  permanent?: boolean;
  presentation?: "banner" | "perk";
}

export default function InstallSidebarBanner({
  permanent = false,
  presentation = "banner",
}: IInstallSidebarBannerProps) {
  const {
    ready,
    canShowInstallUI,
    canInstall,
    isIOS,
    isStandalone,
    supportsInstall,
    promptInstall,
  } = useInstallPrompt();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const showUnsupportedBanner =
    permanent &&
    presentation === "banner" &&
    ready &&
    !isStandalone &&
    !supportsInstall;

  if (showUnsupportedBanner) {
    return (
      <Banner
        variant="primarySoft"
        size="lg"
        icon={CircleAlert}
        title="Ovaj preglednik nije podržan"
        text="Pokušaj otvoriti Disscount u drugom pregledniku, npr. Google Chrome."
        className="mb-0"
      />
    );
  }

  async function handleInstall() {
    if (canInstall) {
      await promptInstall();
      return;
    }

    setInstructionsOpen(true);
  }

  const perkContent = (
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

  if (presentation === "perk") {
    const canUseInstallAction = ready && !isStandalone && supportsInstall;

    if (!canUseInstallAction) {
      return <div className="flex items-center gap-4">{perkContent}</div>;
    }

    return (
      <>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start gap-4 whitespace-normal p-0 text-left"
          onClick={handleInstall}
        >
          {perkContent}
        </Button>

        <InstallInstructionsSheet
          open={instructionsOpen}
          onOpenChange={setInstructionsOpen}
          isIOS={isIOS}
        />
      </>
    );
  }

  const shouldShow = permanent ? ready && !isStandalone : canShowInstallUI;

  if (!shouldShow) return null;

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
