"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { CircleAlert, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/custom/common/banner";
import { useInstallPrompt } from "@/components/custom/pwa/use-install-prompt";
import InstallInstructionsSheet from "@/components/custom/pwa/install-instructions-sheet";
import {
  installActionLabelKey,
  installPitchKey,
} from "@/components/custom/pwa/install-copy";
import { cn } from "@/lib/utils";

interface IInstallCardProps {
  /** Always shown once ready, rather than only when the prompt is available. */
  permanent?: boolean;
}

/** No unsupported state, because beforeinstallprompt is Chromium-only and macOS Safari and Firefox on Android install through their menus. */
export default function InstallCard({ permanent = false }: IInstallCardProps) {
  const t = useTranslations("common");
  const {
    canShowInstallUI,
    canPromoteInstall,
    showUnsupportedNotice,
    canInstall,
    platform,
    promptInstall,
  } = useInstallPrompt();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // The landing page promises the app is installable, so it owes an explanation where it is not; the sidebar just stays quiet.
  if (permanent && showUnsupportedNotice) {
    return (
      <Banner
        variant="primarySoft"
        size="lg"
        icon={CircleAlert}
        title={t("install.unsupportedTitle")}
        text={t("install.unsupportedText")}
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
            {t(installPitchKey(platform))}
          </p>
        </div>

        <Button className="w-full" onClick={handleInstall}>
          <Plus aria-hidden="true" className="size-4" />
          {t(installActionLabelKey(platform))}
        </Button>
      </div>

      <InstallInstructionsSheet
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        platform={platform}
      />
    </>
  );
}
