"use client";

import Link from "next/link";
import Image from "next/image";
import { Lightbulb, Bug, Mail } from "lucide-react";

import LinkedInIcon from "@/components/icons/linkedin-icon";
import GithubIcon from "@/components/icons/github-icon";
import CopyrightIcon from "@/components/icons/copyright-icon";

export default function FooterSection() {
  return (
    <footer className="mt-auto">
      <div className="m-4">
        <div className="bg-background/50 mx-auto max-w-5xl rounded-2xl border backdrop-blur-sm p-6  flex flex-wrap items-center justify-between gap-2">
          <div
            aria-label="Copyright Jakov Jakovac 2025"
            className="text-muted-foreground text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2"
          >
            <Link href="/" className="flex items-center space-x-2">
              {/* App logo */}
              <Image
                src="/disscount-logo.png"
                alt="Disscount logo"
                width={128}
                height={128}
                className="size-6 sm:size-8"
              />

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
            {/* Feedback entry points, mirroring the sidebar's Pomoć i podrška
                group. All three stay disabled until their pages/modals ship. */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled
                aria-label="Ideje i prijedlozi (uskoro)"
                title="Uskoro"
                className="text-muted-foreground/50 block cursor-not-allowed"
              >
                <Lightbulb size={16} />
              </button>

              <button
                type="button"
                disabled
                aria-label="Prijavi grešku (uskoro)"
                title="Uskoro"
                className="text-muted-foreground/50 block cursor-not-allowed"
              >
                <Bug size={16} />
              </button>

              <button
                type="button"
                disabled
                aria-label="Kontakt (uskoro)"
                title="Uskoro"
                className="text-muted-foreground/50 block cursor-not-allowed"
              >
                <Mail size={16} />
              </button>
            </div>

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
      </div>
    </footer>
  );
}
