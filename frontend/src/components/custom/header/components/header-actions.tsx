import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import BgAnimateButton from "@/components/ui/bg-animate-button";
import { Skeleton } from "@/components/ui/skeleton";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import UserMenu from "@/components/custom/user-menu/user-menu";
import NotificationsDropdown from "@/components/custom/notifications/notifications-dropdown";
import { useIsMobile } from "@/hooks/use-mobile";

export default function HeaderActions() {
  const { isAuthenticated, isLoading } = useUser();

  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between gap-8">
      {isLoading ? (
        <Skeleton
          className={cn("rounded-full", isMobile ? "h-8 w-24" : "h-10 w-28")}
        />
      ) : isAuthenticated ? (
        <div className="flex items-center gap-4">
          <NotificationsDropdown />
          <UserMenu />
        </div>
      ) : (
        <BgAnimateButton
          gradient={"primary"}
          rounded={"full"}
          animation="spin-slow"
          shadow="base"
          size={isMobile ? "sm" : "default"}
          className="cursor-pointer min-w-fit p-[2px]"
          onClick={() => openModalUrl({ name: "login" })}
        >
          <div className="flex items-center space-x-2 p-1">
            <LogIn className="w-5.5" />
            <span>Prijava</span>
          </div>
        </BgAnimateButton>
      )}
    </div>
  );
}
