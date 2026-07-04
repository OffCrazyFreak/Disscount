import ActionEmail from "./components/action-email";
import { getEmailTranslator } from "@/emails/email-translator";
import { defaultLocale, type Locale } from "@/i18n/config";

interface IPasswordResetEmailProps {
  resetUrl: string;
  locale?: Locale;
}

export default function PasswordResetEmail({
  resetUrl,
  locale = defaultLocale,
}: IPasswordResetEmailProps) {
  const t = getEmailTranslator(locale);

  return (
    <ActionEmail
      t={t}
      locale={locale}
      preview={t("reset.preview")}
      heading={t("reset.heading")}
      intro={t("reset.intro")}
      buttonLabel={t("reset.button")}
      buttonUrl={resetUrl}
      footnote={t("reset.footnote")}
    />
  );
}

PasswordResetEmail.PreviewProps = {
  resetUrl: "https://disscount.me/reset-password?token=preview",
} satisfies IPasswordResetEmailProps;
