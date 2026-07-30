"use client";

import InboxNotice from "@/components/custom/common/inbox-notice";
import { useSecurity } from "@/components/custom/settings/security/security-context";

export default function PasswordRecovery() {
  const { recovery } = useSecurity();

  if (!recovery.sentTo) return null;

  return (
    // Appears with no navigation, so it has to be announced.
    <div role="status" aria-live="polite">
      <InboxNotice
        title="Provjeri svoj inbox"
        description="Poslali smo ti poveznicu za promjenu lozinke. Nakon promjene odjavit ćemo te sa svih uređaja."
        email={recovery.sentTo}
      />
    </div>
  );
}
