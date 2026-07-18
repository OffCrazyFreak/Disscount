import { type ReactElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  UserRound,
  Settings2,
  ShieldCheck,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { SettingsTab } from "@/lib/modal/modal-registry";

interface IUserMenuProps {
  /** Replaces the avatar trigger (e.g. the sidebar's user row). Must be a
   *  single element, since `asChild` clones it to attach props and a ref. */
  trigger?: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

const SETTINGS_ITEMS: { tab: SettingsTab; label: string; icon: LucideIcon }[] =
  [
    { tab: "profil", label: "Profil", icon: UserRound },
    { tab: "obavijesti", label: "Obavijesti", icon: Bell },
    { tab: "preference", label: "Preference", icon: Settings2 },
    { tab: "sigurnost", label: "Sigurnost", icon: ShieldCheck },
  ];

export default function UserMenu({ trigger, side }: IUserMenuProps = {}) {
  const { user, logout } = useUser();

  const avatarUser = {
    name: user?.username || "",
    email: user?.email || "",
    image: user?.image || null,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <UserAvatar
            className="font-bold text-sm cursor-pointer"
            user={avatarUser}
            aria-label="User menu"
            size={"xl"}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} className="w-max">
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
            {user?.accountType && user.accountType !== "CONSUMER" && (
              <Badge className="text-xs">
                {ACCOUNT_TYPE_LABELS[user.accountType]}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {SETTINGS_ITEMS.map(({ tab, label, icon: Icon }) => (
          <DropdownMenuItem
            key={tab}
            onSelect={() => openModalUrl({ name: "settings", tab })}
            className="cursor-pointer flex items-center gap-4"
          >
            <Icon />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuItem
          onSelect={logout}
          className="cursor-pointer flex items-center gap-4"
        >
          <LogOut />
          <span>Odjava</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
