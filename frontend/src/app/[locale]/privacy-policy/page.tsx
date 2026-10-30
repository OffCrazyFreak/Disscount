import { Metadata } from "next";
import { localizedUrl } from "@/i18n/alternates";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import LegalPage from "@/components/custom/legal/legal-page";
import LegalSection from "@/components/custom/legal/legal-section";
import { CONTACT_EMAIL } from "@/constants/contact";

export const metadata: Metadata = {
  // Croatian only until the rewrite, so every locale points at the one real page.
  alternates: { canonical: localizedUrl("/privacy-policy", DEFAULT_LOCALE) },
  title: "Pravila privatnosti",
  description: "Kako Disscount prikuplja i koristi tvoje podatke.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Pravila privatnosti"
      intro="Ova pravila objašnjavaju koje podatke Disscount prikuplja i kako ih koristi."
      lastUpdated="13. listopada 2026."
    >
      <LegalSection heading="Koje podatke prikupljamo">
        <p>
          Pri prijavi prikupljamo tvoje ime, email adresu i, ako je dostupna,
          profilnu sliku od pružatelja prijave (Google ili Facebook). Spremamo i
          podatke koje sam stvoriš u aplikaciji, poput popisa za kupnju i
          postavki.
        </p>
      </LegalSection>

      <LegalSection heading="Kako koristimo podatke">
        <p>
          Podatke koristimo za pružanje usluge, prijavu u tvoj račun, prikaz
          tvojih popisa i postavki te slanje obavijesti koje si omogućio.
        </p>
      </LegalSection>

      <LegalSection heading="Lokacija na karti trgovina">
        <p>
          Kad otvoriš kartu trgovina, Cloudflare, naš izvršitelj obrade koji
          poslužuje stranicu, iz IP adrese tvog zahtjeva procjenjuje približnu
          lokaciju na razini grada. Koristimo je samo da kartu otvorimo u tvojoj
          blizini i trgovine poredamo po udaljenosti, a ni nju ni IP adresu ne
          spremamo. Pravna osnova je legitimni interes (članak 6. stavak 1.
          točka (f) GDPR-a).
        </p>
        <p>
          Ako dopustiš pristup lokaciji u pregledniku, točna lokacija ostaje na
          tvom uređaju. Njome se trgovine poredaju po udaljenosti, a nama se ne
          šalje.
        </p>
      </LegalSection>

      <LegalSection heading="Dijeljenje podataka">
        <p>
          Ne prodajemo tvoje podatke. Koristimo Google i Facebook isključivo za
          prijavu putem tvojih postojećih računa.
        </p>
      </LegalSection>

      <LegalSection heading="Brisanje podataka">
        <p>
          Račun i povezane podatke možeš obrisati u bilo kojem trenutku unutar
          aplikacije. Upute se nalaze na stranici brisanja podataka.
        </p>
      </LegalSection>

      <LegalSection heading="Kontakt">
        <p>
          Za pitanja o privatnosti javi se na{" "}
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
