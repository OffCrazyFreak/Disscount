"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { InstagramIcon } from "@/components/custom/icons/InstagramIcon";
import { LinkedInIcon } from "@/components/custom/icons/LinkedinIcon";
import { GithubIcon } from "@/components/custom/icons/GithubIcon";
import { CopyrightIcon } from "@/components/custom/icons/CopyrightIcon";

export default function FooterSection() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");

  return (
    <footer className="mt-auto">
      <div className="m-4">
        <div className="bg-background/50 mx-auto max-w-5xl rounded-2xl border backdrop-blur-sm p-6  flex flex-wrap items-center justify-between gap-6">
          <div
            aria-label="Copyright Jakov Jakovac 2025"
            className="text-muted-foreground text-sm flex-1 flex flex-wrap items-center gap-2"
          >
            <Link href="/" className="flex items-center space-x-2">
              {/* App logo */}
              <Image
                src="/disscount-logo.png"
                alt="Disscount logo"
                width={128}
                height={128}
                className="size-8"
              />

              <span className="font-bold text-primary">Disscount</span>
            </Link>

            <CopyrightIcon size={16} />
            <span className="whitespace-nowrap">
              Jakov Jakovac {new Date().getFullYear()}
            </span>
          </div>

          <div className="mx-auto flex items-center justify-center gap-4">
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
              href="https://github.com/OffCrazyFreak/Disscount"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground hover:text-primary block hover:scale-110 transition-all"
            >
              <GithubIcon size={16} />
            </Link>

            <Link
              href="https://www.linkedin.com/in/jakov-jakovac/"
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
    </footer>
  );
}
