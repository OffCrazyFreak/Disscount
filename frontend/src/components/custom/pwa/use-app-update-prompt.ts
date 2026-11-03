import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { watchServiceWorkerUpdate } from "@/lib/pwa/service-worker-update";

// One id, so a waiting event and the startup check never stack two toasts.
const APP_UPDATE_TOAST_ID = "app-update";

/**
 * Offers a reload once a new deploy's service worker is waiting. Never forced:
 * the waiting worker keeps the old build's chunks cached until the user agrees
 * or closes every tab, so a draft in progress is safe.
 */
export function useAppUpdatePrompt() {
  const t = useTranslations("common");

  useEffect(() => {
    const serwist = window.serwist;
    if (!serwist || !("serviceWorker" in navigator)) return;

    return watchServiceWorkerUpdate({
      serwist,
      serviceWorker: navigator.serviceWorker,
      reload: () => window.location.reload(),
      onUpdateReady(applyUpdate) {
        toast(t("appUpdate.message"), {
          id: APP_UPDATE_TOAST_ID,
          duration: Infinity,
          action: {
            label: t("appUpdate.reload"),
            onClick: () => void applyUpdate(),
          },
          cancel: { label: t("appUpdate.later"), onClick: () => {} },
        });
      },
    });
  }, [t]);
}
