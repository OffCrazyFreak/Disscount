import { Metadata } from "next";
import LegalPage from "@/components/custom/legal-page";
import LegalSection from "@/components/custom/legal-section";

export const metadata: Metadata = {
  title: "Pravila privatnosti",
  description: "Kako Disscount prikuplja i koristi tvoje podatke.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Pravila privatnosti"
      intro="Ova pravila objašnjavaju koje podatke Disscount prikuplja i kako ih koristi."
      lastUpdated="21. lipnja 2026."
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
          <a className="text-primary underline" href="mailto:info@disscount.me">
            info@disscount.me
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
