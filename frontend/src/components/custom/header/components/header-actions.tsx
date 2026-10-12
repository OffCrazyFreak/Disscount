import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import UserMenu from "@/components/custom/user-menu/user-menu";
import NotificationsDropdown from "@/components/custom/notifications/notifications-dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import LanguageSwitcher from "@/components/custom/locale/language-switcher";

export default function HeaderActions() {
  // isInitializing, not isLoading: a background session refresh must not
  // unmount the bell, or it tears down an open notifications menu mid-use.
  const { isAuthenticated, isInitializing } = useUser();

  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between gap-8">
      {/* Below md the sidebar footer carries the switcher, keeping the bar uncluttered */}
      <LanguageSwitcher className="hidden md:inline-flex" />

      {isInitializing ? (
        <Skeleton
          className={cn("rounded-full", isMobile ? "h-8 w-24" : "h-10 w-28")}
        />
      ) : isAuthenticated ? (
        <div className="flex items-center gap-4">
          <NotificationsDropdown openViaContext />
          <UserMenu />
        </div>
      ) : (
        <Button
          variant="primary"
          effect="gradientSlideShow"
          size={isMobile ? "default" : "lg"}
          icon={LogIn}
          iconPlacement="left"
          className="min-w-fit rounded-full"
          onClick={() => openModalUrl({ name: "login" })}
        >
          Prijava
        </Button>
      )}
    </div>
  );
}
