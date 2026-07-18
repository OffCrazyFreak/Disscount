"use client";

import { useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { authClient } from "@/lib/auth-client";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { useSecurity } from "@/components/custom/settings/tabs/security/security-context";

type SocialProvider = "google" | "facebook";

const PROVIDERS: {
  id: SocialProvider;
  label: string;
  Icon: typeof GoogleIcon;
}[] = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
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
      <div className="">
        {PROVIDERS.map(({ id, label, Icon }) => {
          const linked = accounts.find((a) => a.providerId === id);
          const comingSoon = id === "facebook" && FACEBOOK_COMING_SOON;
          const onlyMethod = !!linked && signInMethods <= 1;

          return (
            <SettingRow
              key={id}
              className="py-2"
              label={
                <span className="flex items-center gap-2">
                  <Icon className="size-5" />
                  {label}
                  {comingSoon && <Badge className="text-[10px]">USKORO</Badge>}
                </span>
              }
              control={
                linked && !comingSoon ? (
                  <Button
                    type="button"
                    variant="outline"
                    icon={Unlink}
                    iconPlacement="left"
                    disabled={onlyMethod || pending === id}
                    onClick={() => unlink(id, linked.accountId)}
                  >
                    Odspoji
                  </Button>
                ) : (
                  <Button
                    type="button"
                    icon={Link2}
                    iconPlacement="left"
                    disabled={comingSoon || pending === id}
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
