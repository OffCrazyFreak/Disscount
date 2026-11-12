import { useEffect, useEffectEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { watchServiceWorkerUpdate } from "@/lib/pwa/service-worker-update";

// One id, so a waiting event and the startup check never stack two toasts.
const APP_UPDATE_TOAST_ID = "app-update";

/** Never forces a reload, because the waiting worker keeps old chunks; other tabs get the chunk reload. */
export function useAppUpdatePrompt() {
  const t = useTranslations("common");

  // An effect event, so a locale change does not resubscribe and bring back a toast the user dismissed.
  const showUpdateToast = useEffectEvent((applyUpdate: () => Promise<void>) => {
    toast(t("appUpdate.message"), {
      id: APP_UPDATE_TOAST_ID,
      duration: Infinity,
      action: {
        label: t("appUpdate.reload"),
        onClick: () => void applyUpdate(),
      },
    });
  });

  useEffect(() => {
    const serwist = window.serwist;
    if (!serwist || !("serviceWorker" in navigator)) return;

    return watchServiceWorkerUpdate({
      serwist,
      serviceWorker: navigator.serviceWorker,
      visibility: document,
      reload: () => window.location.reload(),
      onUpdateReady: showUpdateToast,
    });
  }, []);
}
