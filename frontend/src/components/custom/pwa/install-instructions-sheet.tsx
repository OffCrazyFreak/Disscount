"use client";

import { ReactNode } from "react";
import { SquareArrowUp, Plus, EllipsisVertical, Download } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface IInstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
}

interface IStep {
  text: ReactNode;
}

// Manual steps for browsers with no usable install-prompt API.
export default function InstallInstructionsSheet({
  open,
  onOpenChange,
  isIOS,
}: IInstallInstructionsSheetProps) {
  const steps: IStep[] = isIOS
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
              <span className="font-medium">Dodaj na početni zaslon</span> (ili{" "}
              <span className="font-medium">Instaliraj aplikaciju</span>).
            </>
          ),
        },
        {
          text: <>Potvrdi odabir.</>,
        },
      ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Dodaj na početni zaslon</DrawerTitle>
          <DrawerDescription>
            Dodaj Disscount na početni zaslon u nekoliko koraka.
          </DrawerDescription>
        </DrawerHeader>

        <ol className="flex flex-col gap-4 px-4 pb-8">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </DrawerContent>
    </Drawer>
  );
}
