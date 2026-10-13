import type { AppLocale } from "@/i18n/locales";
import { authClient } from "@/lib/auth/client";

// One queue for every account language save (the first-sign-in seed and each
// explicit switch), at module scope so saves land in order across the remount a
// switch causes.
let queue: Promise<void> = Promise.resolve();

export function queueAccountLocaleSave(
  owner: string,
  locale: AppLocale,
  onFailure: () => void,
) {
  queue = queue
    .then(async () => {
      // A queued save must not land on whoever signed in after it was queued.
      const { data } = await authClient.getSession();
      if (data?.user.id !== owner) return;

      const { error } = await authClient.updateUser({ locale });
      if (error) onFailure();
    })
    // A rejected link would stop every later save from running.
    .catch(onFailure);
}
