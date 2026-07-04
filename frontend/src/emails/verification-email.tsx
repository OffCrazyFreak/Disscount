import ActionEmail from "./components/action-email";
import { getEmailTranslator } from "@/emails/email-translator";
import { defaultLocale, type Locale } from "@/i18n/config";

interface IVerificationEmailProps {
  verificationUrl: string;
  locale?: Locale;
}

export default function VerificationEmail({
  verificationUrl,
  locale = defaultLocale,
}: IVerificationEmailProps) {
  const t = getEmailTranslator(locale);

  return (
    <ActionEmail
      t={t}
      locale={locale}
      preview={t("verify.preview")}
      heading={t("verify.heading")}
      intro={t("verify.intro")}
      buttonLabel={t("verify.button")}
      buttonUrl={verificationUrl}
      footnote={t("verify.footnote")}
    />
  );
}

VerificationEmail.PreviewProps = {
  verificationUrl: "https://disscount.me/api/auth/verify-email?token=preview",
} satisfies IVerificationEmailProps;
