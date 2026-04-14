"use client";
import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { JSX, Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import BgAnimateButton from "@/components/ui/bg-animate-button";
import { AuthModal } from "@/components/custom/header/forms/auth-modal";
import { useUser } from "@/context/user-context";
import UserMenu from "@/components/custom/header/user-menu";
import NotificationsDropdown from "@/components/custom/header/notifications-dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import { userNavItems } from "@/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/notifications-context";

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false); // Track if the page is scrolled for header opacity

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useUser();

  const isMobile = useIsMobile();
  const pathname = usePathname();

  const { notifications, hasNotifications } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />

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
                <SidebarTrigger />

                <Link href="/" className="flex items-center space-x-2">
                  {/* App logo */}
                  <Image
                    src="/disscount-logo.png"
                    alt="Disscount logo"
                    width={128}
                    height={128}
                    className="size-8 sm:size-10"
                  />
                  <span className="font-saira-stencil-semibold text-2xl sm:text-3xl text-primary">
                    disscount
                  </span>
                </Link>
              </div>

              <ul className="hidden md:flex gap-8 text-sm ">
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <li
                      key={item.id}
                      className={cn(!item.showInHeader && "hidden")}
                    >
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
                          {item.label}

                          {item.badge && hasNotifications && (
                            <Badge className="absolute -top-2 -right-3.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600">
                              {notifications.length}
                            </Badge>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
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
                {isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <NotificationsDropdown />
                    <UserMenu />
                  </div>
                ) : (
                  <BgAnimateButton
                    gradient={"forest"}
                    rounded={"full"}
                    animation="spin-slow"
                    shadow="base"
                    size={isMobile ? "sm" : "default"}
                    className="cursor-pointer min-w-fit"
                    onClick={() => {
                      setIsAuthModalOpen(true);
                    }}
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
