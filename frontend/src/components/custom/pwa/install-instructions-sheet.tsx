"use client";

import { ComponentType, ReactNode } from "react";
import {
  SquareArrowUp,
  Plus,
  EllipsisVertical,
  Download,
  type LucideProps,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface InstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
}

interface Step {
  text: ReactNode;
}

// Renders a bold chunk and an inline icon inside a rich translation message.
function bold(chunks: ReactNode) {
  return <span className="font-medium">{chunks}</span>;
}

function inlineIcon(Icon: ComponentType<LucideProps>) {
  return () => <Icon className="inline size-5 text-primary" />;
}

// Manual install steps for browsers without a usable install-prompt API:
// iOS Safari uses Share -> Add to Home Screen; other browsers use their menu.
export default function InstallInstructionsSheet({
  open,
  onOpenChange,
  isIOS,
}: InstallInstructionsSheetProps) {
  const t = useTranslations("pwa");

  const steps: Step[] = isIOS
    ? [
        { text: t.rich("iosStep1", { b: bold, icon: inlineIcon(SquareArrowUp) }) },
        { text: t.rich("iosStep2", { b: bold, icon: inlineIcon(Plus) }) },
        { text: t.rich("iosStep3", { b: bold }) },
      ]
    : [
        { text: t.rich("androidStep1", { icon: inlineIcon(EllipsisVertical) }) },
        { text: t.rich("androidStep2", { b: bold, icon: inlineIcon(Download) }) },
        { text: t("androidStep3") },
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("addToHome")}</SheetTitle>
          <SheetDescription>{t("instructionsDescription")}</SheetDescription>
        </SheetHeader>

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
      </SheetContent>
    </Sheet>
  );
}
