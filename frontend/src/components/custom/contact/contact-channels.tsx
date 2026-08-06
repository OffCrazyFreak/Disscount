"use client";

import Link from "next/link";
import { Bug, ExternalLink, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import CopyButton from "@/components/custom/common/copy-button";
import { CONTACT_EMAIL, LINKEDIN_URL } from "@/constants/contact";

/** Intro line plus links to the dedicated idea and bug flows. */
export default function ContactChannels() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">
        Pošalji nam poruku kroz obrazac ispod, direktno na{" "}
        <span className="text-foreground inline-flex items-center gap-0.5 align-middle font-medium">
          {CONTACT_EMAIL}
          <CopyButton
            value={CONTACT_EMAIL}
            label="Kopiraj e-mail adresu"
            successMessage="E-mail adresa je kopirana!"
            errorMessage="Greška pri kopiranju e-maila"
          />
        </span>{" "}
        ili putem{" "}
        <Button
          asChild
          type="button"
          variant="ghost"
          className="h-6 gap-1 px-1.5 align-middle"
        >
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
            LinkedIn-a
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        .
      </p>

      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <Lightbulb className="text-muted-foreground size-4 shrink-0" />
          <Link href="/suggestions" className="hover:underline">
            Predloži ideju
          </Link>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Otvori Ideje i prijedloge"
          >
            <Link href="/suggestions">
              <ExternalLink />
            </Link>
          </Button>
        </li>

        <li className="flex items-center gap-2">
          <Bug className="text-muted-foreground size-4 shrink-0" />
          <Link href="?modal=bug-report" className="hover:underline">
            Prijavi grešku
          </Link>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Otvori prijavu greške"
          >
            <Link href="?modal=bug-report">
              <ExternalLink />
            </Link>
          </Button>
        </li>
      </ul>
    </div>
  );
}
