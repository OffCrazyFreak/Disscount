import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import {
  Settings,
  LogOut,
  UserRoundCog,
  UserRoundPen,
  UserRound,
  Settings2,
} from "lucide-react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import UserPreferencesModal from "@/components/forms/user-preferences-modal";
import AccountDetailsModal from "@/components/forms/account-details-modal";

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    // optionally redirect to home
    router.push("/");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UserAvatar
            className="font-bold text-sm cursor-pointer"
            user={user}
            aria-label="User menu"
            size={"xl"}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          {/* User name and email */}
          <DropdownMenuLabel className="flex items-center justify-between gap-3">
            {user?.image && (
              <UserAvatar
                className="font-bold text-sm"
                user={user}
                size={"lg"}
              />
            )}
            <div className="space-y-1">
              <div className="font-bold">{user?.username}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
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
              setIsAccountDetailsOpen(true);
            }}
            className="cursor-pointer flex items-center gap-4"
          >
            <UserRound />
            <span>Račun</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={handleLogout}
            className="cursor-pointer flex items-center gap-4"
          >
            <LogOut />
            <span>Odjava</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDetailsModal
        isOpen={isAccountDetailsOpen}
        onOpenChange={setIsAccountDetailsOpen}
      />
      <UserPreferencesModal
        isOpen={isPreferencesOpen}
        onOpenChange={setIsPreferencesOpen}
      />
    </>
  );
}
