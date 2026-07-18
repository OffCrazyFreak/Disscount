import { ReactNode } from "react";

interface ILegalSectionProps {
  heading: string;
  children: ReactNode;
}

// A titled section within a legal page, kept consistent across all three pages.
export default function LegalSection({ heading, children }: ILegalSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="space-y-2 text-pretty leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
