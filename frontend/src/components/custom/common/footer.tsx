"use client";

import Link from "next/link";

import CartLogo from "@/components/icons/cart-logo";
import FooterSupportIcons from "@/components/custom/common/footer-support-icons";

import LinkedInIcon from "@/components/icons/linkedin-icon";
import GithubIcon from "@/components/icons/github-icon";
import CopyrightIcon from "@/components/icons/copyright-icon";
import { GITHUB_REPO_URL, LINKEDIN_URL } from "@/constants/contact";

export default function FooterSection() {
  return (
    <footer className="mt-auto">
      <div className="m-4">
        <div className="bg-background/50 mx-auto max-w-5xl rounded-2xl border backdrop-blur-sm p-6 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-2">
          <div
            aria-label="Copyright Jakov Jakovac 2025"
            className="text-muted-foreground text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2"
          >
            <Link href="/" className="flex items-center space-x-2">
              {/* App logo */}
              <CartLogo className="size-8 sm:size-10 text-primary" />

              <span className="font-saira-stencil-semibold text-primary text-md sm:text-lg">
                disscount
              </span>
            </Link>

            <CopyrightIcon size={14} />

            <span className="whitespace-nowrap">
              Jakov Jakovac {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-4 flex-wrap">
            <FooterSupportIcons />

            {/* Divider: horizontal between the two rows on mobile, vertical on desktop */}
            <span className="bg-border h-px w-4 sm:h-4 sm:w-px" aria-hidden />

            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              {/* <Link
                href={isEnglish ? "/" : "/en"}
                aria-label={
                  isEnglish ? "Switch to Croatian" : "Switch to English"
                }
                className="block hover:scale-110 transition-all"
              >
                <Image
                  src={isEnglish ? "/flags/cro.png" : "/flags/eng.png"}
                  alt={isEnglish ? "Croatian flag" : "English flag"}
                  width={32}
                  height={32}
                  className="size-6"
                />
              </Link> */}

              <Link
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground hover:text-primary block hover:scale-110 transition-all"
              >
                <GithubIcon size={16} />
              </Link>

              <Link
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-muted-foreground hover:text-primary block hover:scale-110 transition-all"
              >
                <LinkedInIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
