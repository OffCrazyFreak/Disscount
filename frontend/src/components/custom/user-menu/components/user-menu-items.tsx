import { useTranslations } from "next-intl";
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

const SETTINGS_ITEMS: {
  tab: SettingsTab;
  labelKey:
    | "userMenu.profile"
    | "userMenu.notifications"
    | "userMenu.preferences"
    | "userMenu.security";
  icon: LucideIcon;
}[] = [
  { tab: "profil", labelKey: "userMenu.profile", icon: UserRound },
  { tab: "obavijesti", labelKey: "userMenu.notifications", icon: Bell },
  { tab: "preference", labelKey: "userMenu.preferences", icon: Settings2 },
  { tab: "sigurnost", labelKey: "userMenu.security", icon: ShieldCheck },
];

interface IUserMenuItemsProps {
  onLogout: () => void;
}

export default function UserMenuItems({ onLogout }: IUserMenuItemsProps) {
  const t = useTranslations("shell");

  return (
    <>
      {SETTINGS_ITEMS.map(({ tab, labelKey, icon: Icon }) => (
        <DropdownMenuItem
          key={tab}
          onSelect={() => openModalUrl({ name: "settings", tab })}
          className="cursor-pointer flex items-center gap-4"
        >
          <Icon aria-hidden="true" className="size-6" />
          <span>{t(labelKey)}</span>
        </DropdownMenuItem>
      ))}

      <DropdownMenuItem
        onSelect={onLogout}
        className="cursor-pointer flex items-center gap-4"
      >
        <LogOut aria-hidden="true" className="size-6" />
        <span>{t("userMenu.logout")}</span>
      </DropdownMenuItem>
    </>
  );
}
