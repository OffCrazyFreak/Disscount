import { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface ILegalPageProps {
  title: string;
  intro: string;
  lastUpdated: string;
  children: ReactNode;
}

// Shared wrapper for the static legal pages (terms, privacy, data deletion).
// Refined, on-brand layout using the app's design tokens.
export default async function LegalPage({
  title,
  intro,
  lastUpdated,
  children,
}: ILegalPageProps) {
  const t = await getTranslations("legal");

  return (
    <article className="mx-auto max-w-2xl py-10">
      <header className="space-y-3 border-b pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("documentsLabel")}
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-primary">{title}</span>
        </h1>

        <p className="text-pretty text-muted-foreground">{intro}</p>

        <p className="text-xs text-muted-foreground">
          {t("lastUpdatedLabel")}: {lastUpdated}
        </p>
      </header>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">{t("draftNotice")}</p>
      </div>

      <div className="mt-8 space-y-8">{children}</div>
    </article>
  );
}

interface ILegalSectionProps {
  heading: string;
  children: ReactNode;
}

// A titled section within a legal page, kept consistent across all three pages.
export function LegalSection({ heading, children }: ILegalSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="space-y-2 text-pretty leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
