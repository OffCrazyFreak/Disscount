"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";
import { authClient } from "@/lib/auth-client";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { useSecurity } from "./security-context";

type SocialProvider = "google" | "facebook";

const PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
];

export function LinkedAccounts() {
  const { accounts, hasPassword, reload } = useSecurity();
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const linkedSocials = accounts.filter((a) => a.providerId !== "credential");
  const signInMethods = (hasPassword ? 1 : 0) + linkedSocials.length;

  async function link(provider: SocialProvider) {
    setPending(provider);
    await authClient.linkSocial({
      provider,
      callbackURL: "/?modal=settings/sigurnost",
    });
  }

  async function unlink(providerId: SocialProvider, accountId: string) {
    setPending(providerId);
    const { error } = await authClient.unlinkAccount({ providerId, accountId });
    setPending(null);

    if (error) {
      toast.error("Greška pri odspajanju računa.");
      return;
    }
    toast.success("Račun je odspojen.");
    reload();
  }

  return (
    <SettingsSection
      icon={Link2}
      label="Povezani računi"
      hint="Poveži društvene račune za bržu prijavu."
    >
      <div className="divide-y">
        {PROVIDERS.map(({ id, label }) => {
          const linked = accounts.find((a) => a.providerId === id);
          const comingSoon = id === "facebook" && FACEBOOK_COMING_SOON;
          const onlyMethod = !!linked && signInMethods <= 1;

          return (
            <SettingRow
              key={id}
              label={label}
              description={linked ? "Povezano" : "Nije povezano"}
              control={
                comingSoon ? (
                  <Badge variant="secondary">USKORO</Badge>
                ) : linked ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={onlyMethod || pending === id}
                    onClick={() => unlink(id, linked.accountId)}
                  >
                    Odspoji
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending === id}
                    onClick={() => link(id)}
                  >
                    Poveži
                  </Button>
                )
              }
            />
          );
        })}
      </div>
    </SettingsSection>
  );
}
