import ActionEmail from "./components/action-email";
import { getEmailTranslator } from "@/emails/email-translator";
import { defaultLocale, type Locale } from "@/i18n/config";

interface ISetPasswordEmailProps {
  setPasswordUrl: string;
  locale?: Locale;
}

// Sent when someone registers with an email that already has an OAuth-only account
// (Google/Facebook) but no password. Wording reads as "finish setting up" rather than
// "reset", since they are adding email/password login for the first time.
export default function SetPasswordEmail({
  setPasswordUrl,
  locale = defaultLocale,
}: ISetPasswordEmailProps) {
  const t = getEmailTranslator(locale);

  return (
    <ActionEmail
      t={t}
      locale={locale}
      preview={t("setPassword.preview")}
      heading={t("setPassword.heading")}
      intro={t("setPassword.intro")}
      buttonLabel={t("setPassword.button")}
      buttonUrl={setPasswordUrl}
      footnote={t("setPassword.footnote")}
    />
  );
}

SetPasswordEmail.PreviewProps = {
  setPasswordUrl: "https://disscount.me/reset-password?token=preview",
} satisfies ISetPasswordEmailProps;
