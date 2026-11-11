import { Metadata } from "next";
import { localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import LegalPage from "@/components/custom/legal/legal-page";
import LegalSection from "@/components/custom/legal/legal-section";
import { CONTACT_EMAIL } from "@/constants/contact";

export const metadata: Metadata = {
  // Croatian only until the rewrite, so every locale points at the one real page.
  alternates: { canonical: localizedUrl("/data-deletion", DEFAULT_LOCALE) },
  title: "Brisanje podataka",
  description: "Kako obrisati svoj račun i podatke iz aplikacije Disscount.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Brisanje podataka"
      intro="Upute za brisanje tvog računa i povezanih podataka iz Disscounta."
      lastUpdated="5. studenoga 2026."
    >
      <LegalSection heading="Brisanje unutar aplikacije">
        <p>
          Prijavi se, otvori izbornik računa pa odaberi Sigurnost. Tamo možeš
          obrisati svoj račun. Što brišemo, a što ostaje, piše niže.
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
          Trajno brišemo prijavu i sve sesije, zajedno s imenom, emailom i
          profilnom slikom. Brišemo i kartice vjernosti s fotografijama i
          nazivima trgovina, omiljene trgovine na karti i fotografije proizvoda
          koje još nisu odobrene. Iz poruka za kontakt brišemo ime i email, i iz
          onih poslanih bez prijave s emailom tvog računa.
        </p>
        <p>
          Poveznice za dijeljenje tvojih popisa prestaju raditi. Tko otvori
          takvu poveznicu, dobije isti odgovor kao za popis koji ne postoji.
        </p>
        <p>
          Ono što brišemo nestaje i iz sigurnosnih kopija, najkasnije 31 dan
          nakon brisanja, kako kopije istječu (više u pravilima privatnosti).
        </p>
      </LegalSection>

      <LegalSection heading="Što ostaje">
        <p>
          Popisi za kupnju, praćeni proizvodi, tvoje trgovine i lokacije te
          tekst poruka za kontakt ostaju u bazi, vezani uz nasumični
          identifikator računa, bez imena i emaila. Uz isti identifikator ostaje
          i nekoliko podataka profila: vrsta računa, datum registracije i zadnje
          aktivnosti, postavke obavijesti i odgovori iz uvodnih koraka. Tvoje
          promjene na tuđim popisima ostaju na tim popisima.
        </p>
        <p>
          Zato u poruke za kontakt ne upisuj osobne podatke koje ne želiš
          ostaviti kod nas.
        </p>
        <p>
          Bez roka čuvamo i zapis o brisanju s istim identifikatorom i vremenom
          brisanja. Po njemu znamo da je račun obrisan, pa ga stara prijava ne
          može ponovno stvoriti, a nakon vraćanja baze iz kopije račun opet
          brišemo. Zapis ne sadrži ni ime ni email.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
