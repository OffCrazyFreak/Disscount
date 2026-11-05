"use client";

import { useEffect, useRef } from "react";
import { Coffee, HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { KO_FI_URL } from "@/constants/donation";
import { closeModalUrl } from "@/lib/modal/modal-navigation";

interface IDonationModalProps {
  open: boolean;
}

/** Public support prompt, reachable from the sidebar and footer. */
export default function DonationModal({ open }: IDonationModalProps) {
  const t = useTranslations("common");
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function rememberTrigger(target: EventTarget | null) {
      if (!(target instanceof Element)) return;

      const trigger = target.closest('a[href*="modal=donate"]');
      if (trigger instanceof HTMLElement) triggerRef.current = trigger;
    }

    function handlePointerDown(event: PointerEvent) {
      rememberTrigger(event.target);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        rememberTrigger(document.activeElement);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleClose() {
    closeModalUrl();

    const trigger = triggerRef.current;
    triggerRef.current = null;

    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      title={t("donation.title")}
      description={
        <>
          <span className="block">{t("donation.intro")}</span>
          <span className="mt-3 block">{t("donation.usage")}</span>
        </>
      }
      size="sm"
      centered
      hero={
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <HeartHandshake className="size-6" aria-hidden />
        </div>
      }
      footer={
        <div className="px-6 pb-6 pt-4">
          {/* TODO: Add a GitHub Sponsors button beside Ko-fi after the profile is live. */}
          <Button asChild icon={Coffee} iconPlacement="left" className="w-full">
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
              {t("donation.kofi")}
            </a>
          </Button>
        </div>
      }
    />
  );
}
