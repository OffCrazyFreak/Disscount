"use client";

import { useTranslations } from "next-intl";
import {
  SquareArrowUp,
  Plus,
  EllipsisVertical,
  Ellipsis,
  Download,
  Dock,
  MonitorDown,
} from "lucide-react";

import SheetShell from "@/components/custom/modal/sheet-shell";
import type { InstallPlatform } from "@/components/custom/pwa/use-install-prompt";
import {
  installActionLabelKey,
  isDesktopPlatform,
} from "@/components/custom/pwa/install-copy";

interface IInstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: InstallPlatform;
}

const ICON_CLASS = "inline size-5 text-primary";

// iOS 26 took Podijeli off the toolbar and put it behind the ... beside the
// address bar. Both layouts are named, since the wording has to match whichever
// iPhone is reading it, and the sheet has to be scrolled to reach the entry.
const IOS_STEPS = [
  "install.steps.iosMenu",
  "install.steps.iosAdd",
  "install.steps.confirmAdd",
] as const;

const MAC_SAFARI_STEPS = [
  "install.steps.macFile",
  "install.steps.macDock",
  "install.steps.confirmAdd",
] as const;

// Chrome is merging "Instaliraj aplikaciju" and "Dodaj na početni zaslon" into
// one entry, and Firefox only ever had the latter, so both names are given.
const ANDROID_STEPS = [
  "install.steps.androidMenu",
  "install.steps.androidChoose",
  "install.steps.confirmInstall",
] as const;

// No "home screen" on a desktop: the address-bar icon is the quick route, and
// the menu entry sits under a submenu rather than at the top level.
const DESKTOP_STEPS = [
  "install.steps.desktopIcon",
  "install.steps.desktopMenu",
  "install.steps.confirmInstall",
] as const;

const STEPS_BY_PLATFORM = {
  ios: IOS_STEPS,
  macSafari: MAC_SAFARI_STEPS,
  android: ANDROID_STEPS,
  desktop: DESKTOP_STEPS,
} satisfies Record<InstallPlatform, readonly string[]>;

// Manual steps for browsers with no usable install-prompt API.
export default function InstallInstructionsSheet({
  open,
  onOpenChange,
  platform,
}: IInstallInstructionsSheetProps) {
  const t = useTranslations("common");
  const steps = STEPS_BY_PLATFORM[platform];
  const isDesktopTarget = isDesktopPlatform(platform);

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={t(installActionLabelKey(platform))}
      description={
        isDesktopTarget
          ? t("install.sheetDescriptionDesktop")
          : t("install.sheetDescriptionMobile")
      }
      srOnlyDescription={false}
      showCloseButton
    >
      <ol className="flex flex-col gap-4">
        {steps.map((stepKey, index) => (
          <li key={stepKey} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {index + 1}
            </span>
            <span>
              {t.rich(stepKey, {
                b: (chunks) => <span className="font-medium">{chunks}</span>,
                ellipsis: () => <Ellipsis className={ICON_CLASS} />,
                vdots: () => <EllipsisVertical className={ICON_CLASS} />,
                share: () => <SquareArrowUp className={ICON_CLASS} />,
                plus: () => <Plus className={ICON_CLASS} />,
                dock: () => <Dock className={ICON_CLASS} />,
                download: () => <Download className={ICON_CLASS} />,
                monitor: () => <MonitorDown className={ICON_CLASS} />,
              })}
            </span>
          </li>
        ))}
      </ol>
    </SheetShell>
  );
}
