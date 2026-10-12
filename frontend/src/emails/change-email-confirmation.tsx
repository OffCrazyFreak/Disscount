import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// Goes to the CURRENT address, so a hijacked session can't move the account.
export default function ChangeEmailConfirmation(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

ChangeEmailConfirmation.PreviewProps = {
  locale: "hr",
  preview: "Potvrdi promjenu email adrese",
  heading: "Potvrdi promjenu email adrese",
  intro:
    "Zatražena je promjena email adrese tvog Disscount računa na nova@email.com.",
  buttonLabel: "Potvrdi promjenu",
  buttonUrl: "https://disscount.me/api/auth/verify-email?token=preview",
  fallback: "Ako gumb ne radi, kopiraj i zalijepi poveznicu u preglednik.",
  footnote:
    "Ako ova promjena ne dolazi od tebe, odmah promijeni lozinku i javi nam se.",
  footer: "Ovaj email primaš jer postoji račun povezan s ovom adresom.",
} satisfies IActionEmailProps;
