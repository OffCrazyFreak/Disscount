import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage, { LegalSection } from "@/components/custom/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal");

  return (
    <LegalPage
      title={t("terms.title")}
      intro={t("terms.intro")}
      lastUpdated={t("lastUpdated")}
    >
      <LegalSection heading={t("terms.acceptHeading")}>
        <p>{t("terms.acceptBody")}</p>
      </LegalSection>

      <LegalSection heading={t("terms.useHeading")}>
        <p>{t("terms.useBody")}</p>
      </LegalSection>

      <LegalSection heading={t("terms.accountsHeading")}>
        <p>{t("terms.accountsBody")}</p>
      </LegalSection>

      <LegalSection heading={t("terms.liabilityHeading")}>
        <p>{t("terms.liabilityBody")}</p>
      </LegalSection>

      <LegalSection heading={t("terms.changesHeading")}>
        <p>{t("terms.changesBody")}</p>
      </LegalSection>

      <LegalSection heading={t("terms.contactHeading")}>
        <p>
          {t.rich("terms.contactBody", {
            mail: (chunks) => (
              <a
                className="text-primary underline"
                href="mailto:info@disscount.me"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
