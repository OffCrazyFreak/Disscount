"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { Loader2, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { authClient } from "@/lib/auth-client";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";

interface LinkedAccount {
  providerId: string;
  accountId: string;
}

interface ILinkedAccountsProps {
  accounts: LinkedAccount[];
  onChanged: () => void;
}

type SocialProvider = "google" | "facebook";

const PROVIDERS: {
  id: SocialProvider;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  comingSoon?: boolean;
}[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  {
    id: "facebook",
    label: "Facebook",
    icon: FacebookIcon,
    comingSoon: FACEBOOK_COMING_SOON,
  },
];

export default function LinkedAccounts({
  accounts,
  onChanged,
}: ILinkedAccountsProps) {
  // Holds the provider currently being linked/unlinked, so only its row spins.
  const [pending, setPending] = useState<SocialProvider | null>(null);

  // A sign-in method is the password (credential) or any linked social account.
  const signInMethodCount = accounts.length;

  async function handleLink(provider: SocialProvider) {
    setPending(provider);
    try {
      // Redirects to the provider and back; the account is linked on return. On failure
      // (e.g. the provider's email doesn't match this account) Better Auth redirects to
      // errorCallbackURL with ?error=, which the app-wide OAuthErrorToast surfaces.
      await authClient.linkSocial({
        provider,
        callbackURL: window.location.pathname,
        errorCallbackURL: window.location.pathname,
      });
    } catch {
      toast.error("Greška pri povezivanju računa.");
      setPending(null);
    }
  }

  async function handleUnlink(provider: SocialProvider, accountId: string) {
    setPending(provider);
    const { error } = await authClient.unlinkAccount({
      providerId: provider,
      accountId,
    });

    if (error) {
      toast.error("Greška pri odspajanju računa.");
    } else {
      toast.success("Račun je odspojen.");
      onChanged();
    }
    setPending(null);
  }

  return (
    <div className="divide-y">
      {PROVIDERS.map(({ id, label, icon: Icon, comingSoon }) => {
        const account = accounts.find((a) => a.providerId === id);
        // Never let the user unlink their only remaining sign-in method.
        const canUnlink = !!account && signInMethodCount > 1;
        const isPending = pending === id;

        return (
          <SettingRow
            key={id}
            label={
              <span className="flex items-center gap-2">
                <Icon className="size-5" />
                {label}
                {account && <Badge className="text-xs">Povezano</Badge>}
                {!account && comingSoon && (
                  <Badge className="text-xs">USKORO</Badge>
                )}
              </span>
            }
            control={
              account ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Unlink}
                  iconPlacement="left"
                  disabled={pending !== null || !canUnlink}
                  onClick={() => handleUnlink(id, account.accountId)}
                  title={
                    canUnlink
                      ? undefined
                      : "Ne možeš odspojiti jedini način prijave."
                  }
                >
                  {isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    "Odspoji"
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Link2}
                  iconPlacement="left"
                  disabled={pending !== null || comingSoon}
                  onClick={() => handleLink(id)}
                >
                  {isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    "Poveži"
                  )}
                </Button>
              )
            }
          />
        );
      })}
    </div>
  );
}
