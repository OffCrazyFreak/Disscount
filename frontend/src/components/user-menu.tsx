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
import { Settings, LogOut } from "lucide-react";
import { UserAvatar } from "@daveyplate/better-auth-ui";

export default function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // optionally redirect to home
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserAvatar
          className="font-bold text-sm"
          user={user}
          aria-label="User menu"
          size={"lg"}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max">
        {/* User name and email */}
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          {user?.image && (
            <UserAvatar className="font-bold text-sm" user={user} size={"lg"} />
          )}
          <div className="space-y-1">
            <div className="font-bold">{user?.username}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => {
            router.push("/settings");
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Postavke
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Odjava
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
