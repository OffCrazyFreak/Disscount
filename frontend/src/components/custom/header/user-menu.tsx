import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserRound, Settings2, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import UserPreferencesModal from "@/components/custom/header/forms/user-preferences-modal";
import ProfileModal from "@/components/custom/header/forms/profile-modal";
import SecurityModal from "@/components/custom/header/forms/security-modal";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

export default function UserMenu() {
  const { user, logout } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const avatarUser = {
    name: user?.username || "",
    email: user?.email || "",
    image: user?.image || null,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UserAvatar
            className="font-bold text-sm cursor-pointer"
            user={avatarUser}
            aria-label="User menu"
            size={"xl"}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          {/* User name and email */}
          <DropdownMenuLabel className="flex items-center justify-between gap-3">
            <UserAvatar
              className="font-bold text-sm"
              user={avatarUser}
              size={"lg"}
            />
            <div className="space-y-1">
              <div className="font-bold">{user?.username}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
              {user?.accountType && (
                <Badge className="text-xs">
                  {ACCOUNT_TYPE_LABELS[user.accountType]}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => {
              setIsPreferencesOpen(true);
            }}
            className="cursor-pointer flex items-center gap-4"
          >
            <Settings2 />
            <span>Preference</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              setIsProfileOpen(true);
            }}
            className="cursor-pointer flex items-center gap-4"
          >
            <UserRound />
            <span>Profil</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              setIsSecurityOpen(true);
            }}
            className="cursor-pointer flex items-center gap-4"
          >
            <ShieldCheck />
            <span>Sigurnost</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={logout}
            className="cursor-pointer flex items-center gap-4"
          >
            <LogOut />
            <span>Odjava</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <SecurityModal isOpen={isSecurityOpen} onOpenChange={setIsSecurityOpen} />
      <UserPreferencesModal
        isOpen={isPreferencesOpen}
        onOpenChange={setIsPreferencesOpen}
      />
    </>
  );
}
