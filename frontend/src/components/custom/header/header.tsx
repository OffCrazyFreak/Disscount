"use client";
import Link from "next/link";
import Image from "next/image";
import { CreditCard, ListChecks, LogIn } from "lucide-react";
import { JSX, useEffect, useState } from "react";
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

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useUser();
  const isMobile = useIsMobile();

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
                  <span className="font-bold text-lg sm:text-xl text-primary">
                    Disscount
                  </span>
                </Link>
              </div>

              <ul className="hidden sm:flex gap-8 text-sm ">
                <li>
                  <Link
                    href="/shopping-lists"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground block duration-150 group hover:scale-110"
                  >
                    <ListChecks className="size-4 group-hover:text-primary transition-colors" />
                    <span className="group-hover:text-primary transition-colors">
                      Popisi za kupnju
                    </span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/digital-cards"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground block duration-150 group hover:scale-110"
                  >
                    <CreditCard className="size-4 group-hover:text-primary transition-all" />
                    <span className="group-hover:text-primary transition-all">
                      Digitalne kartice
                    </span>
                  </Link>
                </li>
              </ul>

              <div className="max-w-72 hidden lg:block flex-1 ml-auto">
                <SearchBar
                  placeholder="Pretraži proizvode..."
                  searchRoute="/products"
                  submitButtonLocation="none"
                  clearable={true}
                  allowScanning={true}
                />
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
