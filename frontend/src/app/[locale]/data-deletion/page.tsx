import { Metadata } from "next";
import LegalPage from "@/components/custom/legal/legal-page";
import LegalSection from "@/components/custom/legal/legal-section";
import { CONTACT_EMAIL } from "@/constants/contact";

export const metadata: Metadata = {
  title: "Brisanje podataka",
  description: "Kako obrisati svoj račun i podatke iz aplikacije Disscount.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Brisanje podataka"
      intro="Upute za brisanje tvog računa i povezanih podataka iz Disscounta."
      lastUpdated="21. lipnja 2026."
    >
      <LegalSection heading="Brisanje unutar aplikacije">
        <p>
          Prijavi se, otvori izbornik računa pa odaberi Sigurnost. Tamo možeš
          obrisati svoj račun. Brisanjem se uklanja tvoj identitet za prijavu, a
          osobni podaci (ime, email, profilna slika) trajno se uklanjaju.
        </p>
      </LegalSection>

      <LegalSection heading="Brisanje na zahtjev">
        <p>
          Ako ne možeš pristupiti računu, pošalji zahtjev za brisanje na{" "}
          <a
            className="text-primary underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>{" "}
          s email adresom povezanom s računom. Zahtjev obrađujemo u razumnom
          roku.
        </p>
      </LegalSection>

      <LegalSection heading="Što se briše">
        <p>
          Uklanjamo tvoje osobne podatke i pristup računu. Pojedini
          anonimizirani zapisi mogu se zadržati ako to zahtijeva zakon.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
