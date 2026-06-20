"use client";

import { useState } from "react";
import { Loader2, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { authClient } from "@/lib/auth-client";

interface LinkedAccount {
  providerId: string;
  accountId: string;
}

interface ILinkedAccountsProps {
  accounts: LinkedAccount[];
  onChanged: () => void;
}

export default function LinkedAccounts({
  accounts,
  onChanged,
}: ILinkedAccountsProps) {
  const [pending, setPending] = useState(false);

  const googleAccount = accounts.find((a) => a.providerId === "google");
  // A login method is the password (credential) or any linked social account.
  const signInMethodCount = accounts.length;
  const canUnlinkGoogle = !!googleAccount && signInMethodCount > 1;

  async function handleLinkGoogle() {
    setPending(true);
    try {
      // Redirects to Google and back; the account is linked on return.
      await authClient.linkSocial({
        provider: "google",
        callbackURL: window.location.pathname,
      });
    } catch {
      toast.error("Greška pri povezivanju Google računa.");
      setPending(false);
    }
  }

  async function handleUnlinkGoogle() {
    if (!googleAccount) return;

    setPending(true);
    const { error } = await authClient.unlinkAccount({
      providerId: "google",
      accountId: googleAccount.accountId,
    });

    if (error) {
      toast.error("Greška pri odspajanju Google računa.");
    } else {
      toast.success("Google račun je odspojen.");
      onChanged();
    }
    setPending(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GoogleIcon className="size-5" />
          <span className="text-sm">Google</span>
          {googleAccount && <Badge className="text-xs">Povezano</Badge>}
        </div>

        {googleAccount ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Unlink}
            iconPlacement="left"
            disabled={pending || !canUnlinkGoogle}
            onClick={handleUnlinkGoogle}
            title={
              canUnlinkGoogle
                ? undefined
                : "Ne možeš odspojiti jedini način prijave."
            }
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : "Odspoji"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Link2}
            iconPlacement="left"
            disabled={pending}
            onClick={handleLinkGoogle}
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : "Poveži"}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FacebookIcon className="size-5" />
          <span className="text-sm">Facebook</span>
        </div>

        <Badge className="text-xs">USKORO</Badge>
      </div>
    </div>
  );
}
