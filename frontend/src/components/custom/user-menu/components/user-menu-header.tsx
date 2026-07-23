import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/custom/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS } from "@/lib/api/schemas/auth-user";
import type { UserDto } from "@/lib/api/types";

interface IUserMenuHeaderProps {
  avatarUser: { name: string; email: string; image: string | null };
  user: UserDto | null;
}

export default function UserMenuHeader({
  avatarUser,
  user,
}: IUserMenuHeaderProps) {
  return (
    <DropdownMenuLabel className="flex items-center justify-between gap-3">
      <UserAvatar className="font-bold text-sm" user={avatarUser} size={"lg"} />
      <div className="space-y-1">
        <div className="font-bold">{user?.username}</div>
        <div className="text-xs text-gray-400">{user?.email}</div>
        {user?.accountType && user.accountType !== "CONSUMER" && (
          <Badge>{ACCOUNT_TYPE_LABELS[user.accountType]}</Badge>
        )}
      </div>
    </DropdownMenuLabel>
  );
}
