"use client";
import Link from "next/link";
import DoodleCartHappyIcon from "@/components/icons/doodle-cart-happy-icon";
import { LogIn, LayoutDashboard } from "lucide-react";
import { JSX, Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import BgAnimateButton from "@/components/ui/bg-animate-button";
import { Skeleton } from "@/components/ui/skeleton";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import UserMenu from "@/components/custom/header/user-menu";
import NotificationsDropdown from "@/components/custom/header/notifications-dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import { userNavItems } from "@/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/notifications-context";

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false); // Track if the page is scrolled for header opacity

  const { isAuthenticated, isLoading, user } = useUser();

  const isMobile = useIsMobile();
  const pathname = usePathname();

  const { notifications, hasNotifications } = useNotifications();

  const showDashboard = canAccessDashboard(user?.accountType);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header>
        <nav className="fixed z-20 inset-x-4 my-4">
          <div
            className={cn(
              "mx-auto max-w-6xl transition-all duration-300 px-2",
              isScrolled &&
                "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-sm px-4",
            )}
          >
            <div className="flex items-center justify-between gap-6 flex-wrap py-2 sm:py-4">
              <div className="flex items-center space-x-2">
                <SidebarTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" />

                <Link href="/" className="flex items-center space-x-2">
                  {/* App logo */}
                  <DoodleCartHappyIcon className="hidden sm:block size-8 sm:size-10 text-primary" />
                  <span className="font-saira-stencil-semibold text-2xl sm:text-3xl text-primary">
                    disscount
                  </span>
                </Link>
              </div>

              <ul className="hidden md:flex gap-8 text-sm">
                {showDashboard ? (
                  <li>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground duration-150 group hover:scale-110 relative",
                        pathname.startsWith("/dashboard") &&
                          "font-bold text-primary",
                      )}
                    >
                      <LayoutDashboard
                        className={cn(
                          "size-4 group-hover:text-primary transition-colors",
                          pathname.startsWith("/dashboard") && "text-primary",
                        )}
                      />
                      <span className="group-hover:text-primary transition-colors">
                        Nadzorna ploča
                      </span>
                    </Link>
                  </li>
                ) : (
                  userNavItems
                    .filter((item) => item.showInHeader)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      const label = item.shortLabel ?? item.label;

                      // Coming-soon items are not navigable in the navbar; the
                      // USKORO badge sits on top, like the notification badge.
                      if (item.comingSoon) {
                        return (
                          <li key={item.id}>
                            <span className="flex items-center space-x-2 text-muted-foreground/70 cursor-not-allowed relative">
                              <Icon className="size-4" />
                              <span className="relative">
                                {label}

                                <Badge className="absolute -top-3 -right-7 h-4 rounded-full px-1 py-0 text-[9px] leading-none">
                                  USKORO
                                </Badge>
                              </span>
                            </span>
                          </li>
                        );
                      }

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground duration-150 group hover:scale-110 relative",
                              isActive && "font-bold text-primary",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4 group-hover:text-primary transition-colors",
                                isActive && "text-primary",
                              )}
                            />
                            <span
                              className={cn(
                                "group-hover:text-primary transition-colors relative",
                                isActive && "text-primary",
                              )}
                            >
                              {label}

                              {item.badge && hasNotifications && (
                                <Badge className="absolute -top-2 -right-3.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                  {notifications.length}
                                </Badge>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })
                )}
              </ul>

              <div className="max-w-72 hidden lg:block flex-1 ml-auto">
                <Suspense
                  fallback={<SearchBarSkeleton submitButtonLocation="none" />}
                >
                  <SearchBar
                    placeholder="Pretraži proizvode..."
                    searchRoute="/products"
                    submitButtonLocation="none"
                    clearable={true}
                    allowScanning={true}
                  />
                </Suspense>
              </div>

              <div className="flex items-center justify-between gap-8">
                {isLoading ? (
                  <Skeleton
                    className={cn(
                      "rounded-full",
                      isMobile ? "h-8 w-24" : "h-10 w-28",
                    )}
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
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
