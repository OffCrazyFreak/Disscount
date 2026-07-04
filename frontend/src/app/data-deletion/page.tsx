import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage, { LegalSection } from "@/components/custom/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.dataDeletion");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DataDeletionPage() {
  const t = await getTranslations("legal");

  return (
    <LegalPage
      title={t("dataDeletion.title")}
      intro={t("dataDeletion.intro")}
      lastUpdated={t("lastUpdated")}
    >
      <LegalSection heading={t("dataDeletion.inAppHeading")}>
        <p>{t("dataDeletion.inAppBody")}</p>
      </LegalSection>

      <LegalSection heading={t("dataDeletion.onRequestHeading")}>
        <p>
          {t.rich("dataDeletion.onRequestBody", {
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

      <LegalSection heading={t("dataDeletion.whatDeletedHeading")}>
        <p>{t("dataDeletion.whatDeletedBody")}</p>
      </LegalSection>
    </LegalPage>
  );
}
