"use client";

import { Link } from "@/i18n/navigation";
import { Bug, ExternalLink, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import CopyButton from "@/components/custom/common/copy-button";
import { CONTACT_EMAIL, LINKEDIN_URL } from "@/constants/contact";

/** Intro line plus links to the dedicated idea and bug flows. */
export default function ContactChannels() {
  const t = useTranslations("common");

  const intro = t.rich("contact.channels.intro", {
    email: () => (
      <span className="text-foreground inline-flex items-center gap-0.5 align-middle font-medium">
        {CONTACT_EMAIL}
        <CopyButton
          value={CONTACT_EMAIL}
          label={t("contact.channels.copyEmailLabel")}
          successMessage={t("contact.channels.copyEmailSuccess")}
          errorMessage={t("contact.channels.copyEmailError")}
        />
      </span>
    ),
    linkedin: (chunks) => (
      <Button
        asChild
        type="button"
        variant="ghost"
        className="h-6 gap-1 px-1.5 align-middle"
      >
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
          {chunks}
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
    ),
  });

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">{intro}</p>

      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <Lightbulb className="text-muted-foreground size-4 shrink-0" />
          <Link href="/suggestions" className="hover:underline">
            {t("contact.channels.suggestIdea")}
          </Link>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={t("contact.channels.openSuggestions")}
          >
            <Link href="/suggestions">
              <ExternalLink />
            </Link>
          </Button>
        </li>

        <li className="flex items-center gap-2">
          <Bug className="text-muted-foreground size-4 shrink-0" />
          <Link href="?modal=bug-report" className="hover:underline">
            {t("contact.channels.reportBug")}
          </Link>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={t("contact.channels.openBugReport")}
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
