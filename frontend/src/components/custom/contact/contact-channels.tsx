"use client";

import Link from "next/link";
import { Bug, Copy, ExternalLink, Lightbulb } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL, LINKEDIN_URL } from "@/constants/contact";

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    toast.success("E-mail adresa je kopirana!");
  } catch {
    toast.error("Greška pri kopiranju e-maila");
  }
}

/** Intro line plus links to the dedicated idea and bug flows. */
export default function ContactChannels() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">
        Pošalji nam poruku kroz obrazac ispod, direktno na{" "}
        <span className="text-foreground inline-flex items-center gap-0.5 align-middle font-medium">
          {CONTACT_EMAIL}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Kopiraj e-mail adresu"
            className="size-6"
            onClick={copyEmail}
          >
            <Copy className="size-3.5" />
          </Button>
        </span>{" "}
        ili putem{" "}
        <Button
          asChild
          type="button"
          variant="ghost"
          size="sm"
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
            className="size-6"
          >
            <Link href="/suggestions">
              <ExternalLink className="size-3.5" />
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
            className="size-6"
          >
            <Link href="?modal=bug-report">
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </li>
      </ul>
    </div>
  );
}
