import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export default async function PrivacyPolicyPage() {
  // The rest of the page is Croatian in every locale, so this section matches it until the rewrite.
  const t = await getTranslations({
    locale: DEFAULT_LOCALE,
    namespace: "privacyPolicy.errorTracking",
  });
  const tIpAddresses = await getTranslations({
    locale: DEFAULT_LOCALE,
    namespace: "privacyPolicy.ipAddresses",
  });
  const tSecurityNotices = await getTranslations({
    locale: DEFAULT_LOCALE,
    namespace: "privacyPolicy.securityNotices",
  });
  const tSecurityLog = await getTranslations({
    locale: DEFAULT_LOCALE,
    namespace: "privacyPolicy.securityLog",
  });
  const tBackups = await getTranslations({
    locale: DEFAULT_LOCALE,
    namespace: "privacyPolicy.backups",
  });

  return (
    <LegalPage
      title="Pravila privatnosti"
      intro="Ova pravila objašnjavaju koje podatke Disscount prikuplja i kako ih koristi."
      lastUpdated="11. studenoga 2026."
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
          tvojih popisa i postavki te slanje obavijesti koje uključiš.
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

      <LegalSection heading={tIpAddresses("heading")}>
        <p>{tIpAddresses("body")}</p>
      </LegalSection>

      <LegalSection heading={tSecurityNotices("heading")}>
        <p>{tSecurityNotices("body")}</p>
      </LegalSection>

      <LegalSection heading={tSecurityLog("heading")}>
        <p>{tSecurityLog("body")}</p>
      </LegalSection>

      <LegalSection heading="Slike proizvoda">
        <p>
          Kad dodaš sliku proizvoda, spremamo je bez metapodataka poput mjesta
          snimanja i povezujemo je s tvojim računom kako bismo spriječili
          zlouporabu. Slika je javno vidljiva, bez tvog imena. Slike čuvamo na
          našem poslužitelju kod Hetznera u Finskoj, u Europskoj uniji. Ako
          obrišeš račun, brišemo tvoje slike koje još nitko nije potvrdio ili su
          skrivene te izvorne datoteke svih tvojih slika. Slike koje je potvrdio
          drugi korisnik ili administrator ostaju kao dio podataka o proizvodu,
          bez ikakve veze s tvojim računom. Ako želiš da uklonimo neku tvoju
          sliku, javi nam se.
        </p>
      </LegalSection>

      <LegalSection heading={t("heading")}>
        <p>{t("collected")}</p>
        <p>{t("replay")}</p>
      </LegalSection>

      <LegalSection heading={tBackups("heading")}>
        <p>{tBackups("body")}</p>
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
