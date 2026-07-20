import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  LogOut,
  UserRound,
  Settings2,
  ShieldCheck,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { SettingsTab } from "@/lib/modal/modal-registry";

const SETTINGS_ITEMS: { tab: SettingsTab; label: string; icon: LucideIcon }[] =
  [
    { tab: "profil", label: "Profil", icon: UserRound },
    { tab: "obavijesti", label: "Obavijesti", icon: Bell },
    { tab: "preference", label: "Preference", icon: Settings2 },
    { tab: "sigurnost", label: "Sigurnost", icon: ShieldCheck },
  ];

interface IUserMenuItemsProps {
  onLogout: () => void;
}

export default function UserMenuItems({ onLogout }: IUserMenuItemsProps) {
  return (
    <>
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
        onSelect={onLogout}
        className="cursor-pointer flex items-center gap-4"
      >
        <LogOut />
        <span>Odjava</span>
      </DropdownMenuItem>
    </>
  );
}
