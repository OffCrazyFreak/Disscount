"use client";

import { ReactNode } from "react";
import {
  SquareArrowUp,
  Plus,
  EllipsisVertical,
  Download,
  Dock,
} from "lucide-react";

import SheetShell from "@/components/custom/modal/sheet-shell";

interface IInstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
  /** Installs from the menu bar rather than a browser menu, so it reads apart. */
  isMacSafari?: boolean;
}

interface IStep {
  text: ReactNode;
}

// Manual steps for browsers with no usable install-prompt API.
export default function InstallInstructionsSheet({
  open,
  onOpenChange,
  isIOS,
  isMacSafari = false,
}: IInstallInstructionsSheetProps) {
  const macSafariSteps: IStep[] = [
    {
      text: (
        <>
          Otvori izbornik <span className="font-medium">Datoteka</span> u traci
          izbornika.
        </>
      ),
    },
    {
      text: (
        <>
          Odaberi <Dock className="inline size-5 text-primary" />{" "}
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

  const steps: IStep[] = isMacSafari
    ? macSafariSteps
    : isIOS
      ? [
          {
            text: (
              <>
                Dodirni gumb{" "}
                <SquareArrowUp className="inline size-5 text-primary" />{" "}
                <span className="font-medium">Podijeli</span> u pregledniku.
              </>
            ),
          },
          {
            text: (
              <>
                Odaberi <Plus className="inline size-5 text-primary" />{" "}
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
        ]
      : [
          {
            text: (
              <>
                Otvori izbornik preglednika{" "}
                <EllipsisVertical className="inline size-5 text-primary" />.
              </>
            ),
          },
          {
            text: (
              <>
                Odaberi <Download className="inline size-5 text-primary" />{" "}
                <span className="font-medium">Dodaj na početni zaslon</span>{" "}
                (ili <span className="font-medium">Instaliraj aplikaciju</span>
                ).
              </>
            ),
          },
          {
            text: <>Potvrdi odabir.</>,
          },
        ];

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={isMacSafari ? "Dodaj u Dock" : "Dodaj na početni zaslon"}
      description={
        isMacSafari
          ? "Dodaj Disscount u Dock u nekoliko koraka."
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
