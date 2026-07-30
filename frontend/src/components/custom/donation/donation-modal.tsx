"use client";

import { useEffect, useRef } from "react";
import { Coffee, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import { KO_FI_URL } from "@/constants/donation";
import { closeModalUrl } from "@/lib/modal/modal-navigation";

interface IDonationModalProps {
  open: boolean;
}

/** Public support prompt, reachable from the sidebar and footer. */
export default function DonationModal({ open }: IDonationModalProps) {
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
      title="Podrži Disscount"
      description="Disscount je besplatan i takav ostaje. Ako ti pomaže pri kupnji, dobrovoljna podrška pomaže pokriti hosting i daljnji razvoj."
      size="sm"
      centered
      hero={
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <HeartHandshake className="size-7" aria-hidden />
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            Ne sada
          </Button>

          <Button asChild icon={Coffee} iconPlacement="left">
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
              Podrži na Ko-fi
            </a>
          </Button>
        </div>
      }
    />
  );
}
