import { type ReactElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/custom/common/user-avatar";
import { useUser } from "@/context/user-context";
import UserMenuHeader from "@/components/custom/user-menu/components/user-menu-header";
import UserMenuItems from "@/components/custom/user-menu/components/user-menu-items";

interface IUserMenuProps {
  /** Replaces the avatar trigger (e.g. the sidebar's user row). Must be a
   *  single element, since `asChild` clones it to attach props and a ref. */
  trigger?: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

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
          <button
            type="button"
            aria-label="Korisnički izbornik"
            className="cursor-pointer rounded-full"
          >
            <UserAvatar
              className="font-bold text-sm"
              user={avatarUser}
              size={"xl"}
            />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} className="w-max">
        {/* User name and email */}
        <UserMenuHeader avatarUser={avatarUser} user={user} />

        <DropdownMenuSeparator />

        <UserMenuItems onLogout={logout} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
