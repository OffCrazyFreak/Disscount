import { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

interface ILegalPageProps {
  title: string;
  intro: string;
  lastUpdated: string;
  children: ReactNode;
}

// Shared by terms, privacy and data deletion.
export default function LegalPage({
  title,
  intro,
  lastUpdated,
  children,
}: ILegalPageProps) {
  return (
    <article className="mx-auto max-w-2xl py-10">
      <header className="space-y-3 border-b pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Pravni dokumenti
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-pretty">
          <span className="text-primary">{title}</span>
        </h1>

        <p className="text-pretty text-muted-foreground">{intro}</p>

        <p className="text-xs text-muted-foreground">
          Zadnje ažurirano: {lastUpdated}
        </p>
      </header>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Ovo je privremena, skraćena verzija. Konačni pravni dokument je u
          izradi.
        </p>
      </div>

      <div className="mt-8 space-y-8">{children}</div>
    </article>
  );
}
