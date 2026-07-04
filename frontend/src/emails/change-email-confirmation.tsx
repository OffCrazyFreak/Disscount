import ActionEmail from "./components/action-email";
import { getEmailTranslator } from "@/emails/email-translator";
import { defaultLocale, type Locale } from "@/i18n/config";

interface IChangeEmailConfirmationProps {
  confirmUrl: string;
  newEmail: string;
  locale?: Locale;
}

// Sent to the user's CURRENT address to approve a change before it applies, so a hijacked
// session can't silently move the account to an attacker's email.
export default function ChangeEmailConfirmation({
  confirmUrl,
  newEmail,
  locale = defaultLocale,
}: IChangeEmailConfirmationProps) {
  const t = getEmailTranslator(locale);

  return (
    <ActionEmail
      t={t}
      locale={locale}
      preview={t("changeEmail.preview")}
      heading={t("changeEmail.heading")}
      intro={t.rich("changeEmail.intro", {
        newEmail,
        b: (chunks) => (
          <span className="font-semibold text-gray-800">{chunks}</span>
        ),
      })}
      buttonLabel={t("changeEmail.button")}
      buttonUrl={confirmUrl}
      footnote={t("changeEmail.footnote")}
    />
  );
}

ChangeEmailConfirmation.PreviewProps = {
  confirmUrl: "https://disscount.me/api/auth/verify-email?token=preview",
  newEmail: "nova@email.com",
} satisfies IChangeEmailConfirmationProps;
