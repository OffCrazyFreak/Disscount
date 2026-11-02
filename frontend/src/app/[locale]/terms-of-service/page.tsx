import { Metadata } from "next";
import { localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import LegalPage from "@/components/custom/legal/legal-page";
import LegalSection from "@/components/custom/legal/legal-section";
import { CONTACT_EMAIL } from "@/constants/contact";

export const metadata: Metadata = {
  // Croatian only until the rewrite, so every locale points at the one real page.
  alternates: { canonical: localizedUrl("/terms-of-service", DEFAULT_LOCALE) },
  title: "Uvjeti korištenja",
  description: "Uvjeti korištenja aplikacije Disscount.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Uvjeti korištenja"
      intro="Korištenjem aplikacije Disscount prihvaćaš ove uvjete."
      lastUpdated="2. studenoga 2026."
    >
      <LegalSection heading="Prihvaćanje uvjeta">
        <p>
          Pristupanjem aplikaciji ili njezinim korištenjem slažeš se s ovim
          uvjetima. Ako se ne slažeš, nemoj koristiti aplikaciju.
        </p>
      </LegalSection>

      <LegalSection heading="Korištenje usluge">
        <p>
          Disscount služi za usporedbu cijena i organizaciju kupnje. Slažeš se
          da aplikaciju nećeš koristiti u nezakonite svrhe ni na način koji
          ometa njezin rad.
        </p>
      </LegalSection>

      <LegalSection heading="Računi">
        <p>
          Za aktivnosti na svom računu odgovaraš ti. Račun možeš obrisati u bilo
          kojem trenutku unutar aplikacije.
        </p>
      </LegalSection>

      <LegalSection heading="Slike proizvoda">
        <p>
          Dio slika proizvoda preuzet je iz baze{" "}
          <a
            className="text-primary underline"
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Food Facts
          </a>{" "}
          i dostupan je pod licencom{" "}
          <a
            className="text-primary underline"
            href="https://creativecommons.org/licenses/by-sa/4.0/deed.hr"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . Te slike prilagođavamo (obrezujemo, smanjujemo i stavljamo na bijelu
          podlogu) i dijelimo ih pod istom licencom. Dizajn pakiranja i
          zaštitni znakovi na slikama pripadaju njihovim vlasnicima.
        </p>
        <p>
          Kad dodaš sliku proizvoda, potvrđuješ da je slika tvoja i da na njoj
          nema ljudi ni osobnih podataka. Dodavanjem nam dopuštaš da je
          besplatno i bez vremenskog ograničenja prikazujemo u aplikaciji i
          prilagođavamo na isti način. Slike koje ne prikazuju proizvod ili
          krše ova pravila možemo ukloniti.
        </p>
      </LegalSection>

      <LegalSection heading="Odgovornost">
        <p>
          Aplikacija se pruža „kakva jest”. Cijene i podaci mogu se razlikovati
          od stvarnih u trgovinama te ne jamčimo njihovu potpunu točnost.
        </p>
      </LegalSection>

      <LegalSection heading="Izmjene">
        <p>
          Ove uvjete možemo povremeno ažurirati. Nastavak korištenja nakon
          izmjena znači prihvaćanje novih uvjeta.
        </p>
      </LegalSection>

      <LegalSection heading="Kontakt">
        <p>
          Za pitanja o uvjetima javi se na{" "}
          <a
            className="text-primary underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
