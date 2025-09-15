import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserRound, Settings2 } from "lucide-react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import UserPreferencesModal from "@/components/custom/header/forms/user-preferences-modal";
import AccountDetailsModal from "@/components/custom/header/forms/account-details-modal";
import { useUser } from "@/context/user-context";

export default function UserMenu() {
  const { user, logout } = useUser();
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UserAvatar
            className="font-bold text-sm cursor-pointer"
            user={{
              name: user?.username || "",
              email: user?.email || "",
              image: null, // API doesn't provide image yet
            }}
            aria-label="User menu"
            size={"xl"}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          {/* User name and email */}
          <DropdownMenuLabel className="flex items-center justify-between gap-3">
            <UserAvatar
              className="font-bold text-sm"
              user={{
                name: user?.username || "",
                email: user?.email || "",
                image: null, // API doesn't provide image yet
              }}
              size={"lg"}
            />
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
            onSelect={logout}
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
