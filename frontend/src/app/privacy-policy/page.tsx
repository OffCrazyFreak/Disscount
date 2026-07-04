import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage, { LegalSection } from "@/components/custom/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal");

  return (
    <LegalPage
      title={t("privacy.title")}
      intro={t("privacy.intro")}
      lastUpdated={t("lastUpdated")}
    >
      <LegalSection heading={t("privacy.collectHeading")}>
        <p>{t("privacy.collectBody")}</p>
      </LegalSection>

      <LegalSection heading={t("privacy.useHeading")}>
        <p>{t("privacy.useBody")}</p>
      </LegalSection>

      <LegalSection heading={t("privacy.shareHeading")}>
        <p>{t("privacy.shareBody")}</p>
      </LegalSection>

      <LegalSection heading={t("privacy.deleteHeading")}>
        <p>{t("privacy.deleteBody")}</p>
      </LegalSection>

      <LegalSection heading={t("privacy.contactHeading")}>
        <p>
          {t.rich("privacy.contactBody", {
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
