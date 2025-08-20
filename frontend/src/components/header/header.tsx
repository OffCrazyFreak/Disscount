"use client";
import Link from "next/link";
import { CreditCard, ListChecks, LogIn } from "lucide-react";
import { JSX, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "../ui/sidebar";
import BgAnimateButton from "../ui/bg-animate-button";
import { AuthModal } from "../forms/auth-modal";
import { useUser } from "@/lib/user-context";
import UserMenu from "./user-menu";

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="">
      <nav className="fixed z-20 inset-x-4 my-4">
        <div
          className={cn(
            "mx-auto max-w-6xl transition-all duration-300 px-6",
            isScrolled &&
              "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-sm px-4"
          )}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap py-2 sm:py-4">
            <div className="flex items-center justify-between sm:w-auto">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <Link href="/" className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-primary">
                    Disscount
                  </span>
                </Link>
              </div>
            </div>

            <ul className="hidden sm:flex gap-8 text-sm ">
              <li>
                <Link
                  href="/shopping-lists"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground block duration-150 group hover:scale-110"
                >
                  <ListChecks className="size-4 group-hover:text-primary transition-colors" />
                  <span className="group-hover:text-primary transition-colors">
                    Shopping liste
                  </span>
                </Link>
              </li>

              <li>
                <Link
                  href="/cards"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground block duration-150 group hover:scale-110"
                >
                  <CreditCard className="size-4 group-hover:text-primary transition-all" />
                  <span className="group-hover:text-primary transition-all">
                    Digitalne kartice
                  </span>
                </Link>
              </li>
            </ul>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <BgAnimateButton
                gradient={"forest"}
                rounded={"full"}
                animation="spin-slow"
                shadow="base"
                className="cursor-pointer min-w-fit"
                onClick={() => {
                  setIsAuthModalOpen(true);
                }}
              >
                <div className="flex items-center space-x-2 px-2 py-1">
                  <LogIn className="w-5.5" />
                  <span className="">Prijava</span>
                </div>
              </BgAnimateButton>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  );
}
