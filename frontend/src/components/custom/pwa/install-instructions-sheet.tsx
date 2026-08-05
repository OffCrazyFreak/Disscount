"use client";

import { ReactNode } from "react";
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
  installActionLabel,
  isDesktopPlatform,
} from "@/components/custom/pwa/install-copy";

interface IInstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: InstallPlatform;
}

interface IStep {
  text: ReactNode;
}

const ICON_CLASS = "inline size-5 text-primary";

// iOS 26 took Podijeli off the toolbar and put it behind the ... beside the
// address bar. Both layouts are named, since the wording has to match whichever
// iPhone is reading it, and the sheet has to be scrolled to reach the entry.
const IOS_STEPS: IStep[] = [
  {
    text: (
      <>
        Dodirni <Ellipsis className={ICON_CLASS} /> pored adresne trake, pa{" "}
        <SquareArrowUp className={ICON_CLASS} />{" "}
        <span className="font-medium">Podijeli</span>. Na starijim iPhoneima{" "}
        <span className="font-medium">Podijeli</span> je odmah u alatnoj traci.
      </>
    ),
  },
  {
    text: (
      <>
        Klizni prema dolje kroz izbornik i odaberi{" "}
        <Plus className={ICON_CLASS} />{" "}
        <span className="font-medium">Dodaj na početni zaslon</span>.
      </>
    ),
  },
  {
    text: (
      <>
        Potvrdi s <span className="font-medium">Dodaj</span>.
      </>
    ),
  },
];

const MAC_SAFARI_STEPS: IStep[] = [
  {
    text: (
      <>
        Otvori izbornik <span className="font-medium">Datoteka</span> u traci
        izbornika na vrhu zaslona.
      </>
    ),
  },
  {
    text: (
      <>
        Odaberi <Dock className={ICON_CLASS} />{" "}
        <span className="font-medium">Dodaj u Dock</span>.
      </>
    ),
  },
  {
    text: (
      <>
        Potvrdi s <span className="font-medium">Dodaj</span>.
      </>
    ),
  },
];

// Chrome is merging "Instaliraj aplikaciju" and "Dodaj na početni zaslon" into
// one entry, and Firefox only ever had the latter, so both names are given.
const ANDROID_STEPS: IStep[] = [
  {
    text: (
      <>
        Dodirni <EllipsisVertical className={ICON_CLASS} /> za izbornik
        preglednika.
      </>
    ),
  },
  {
    text: (
      <>
        Odaberi <Download className={ICON_CLASS} />{" "}
        <span className="font-medium">Instaliraj aplikaciju</span> ili{" "}
        <span className="font-medium">Dodaj na početni zaslon</span>, ovisno o
        pregledniku.
      </>
    ),
  },
  {
    text: (
      <>
        Potvrdi s <span className="font-medium">Instaliraj</span>.
      </>
    ),
  },
];

// No "home screen" on a desktop: the address-bar icon is the quick route, and
// the menu entry sits under a submenu rather than at the top level.
const DESKTOP_STEPS: IStep[] = [
  {
    text: (
      <>
        Klikni <MonitorDown className={ICON_CLASS} /> na desnoj strani adresne
        trake.
      </>
    ),
  },
  {
    text: (
      <>
        Ako te ikone nema, otvori <EllipsisVertical className={ICON_CLASS} />{" "}
        izbornik pa <span className="font-medium">Spremi i podijeli</span>{" "}
        &rsaquo;{" "}
        <span className="font-medium">Instaliraj stranicu kao aplikaciju</span>.
      </>
    ),
  },
  {
    text: (
      <>
        Potvrdi s <span className="font-medium">Instaliraj</span>.
      </>
    ),
  },
];

const STEPS_BY_PLATFORM: Record<InstallPlatform, IStep[]> = {
  ios: IOS_STEPS,
  macSafari: MAC_SAFARI_STEPS,
  android: ANDROID_STEPS,
  desktop: DESKTOP_STEPS,
};

// Manual steps for browsers with no usable install-prompt API.
export default function InstallInstructionsSheet({
  open,
  onOpenChange,
  platform,
}: IInstallInstructionsSheetProps) {
  const steps = STEPS_BY_PLATFORM[platform];
  const isDesktopTarget = isDesktopPlatform(platform);

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={installActionLabel(platform)}
      description={
        isDesktopTarget
          ? "Instaliraj Disscount na računalo u nekoliko koraka."
          : "Dodaj Disscount na početni zaslon u nekoliko koraka."
      }
      srOnlyDescription={false}
      showCloseButton
    >
      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {index + 1}
            </span>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </SheetShell>
  );
}
