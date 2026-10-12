import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

export default function VerificationEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

VerificationEmail.PreviewProps = {
  locale: "hr",
  preview: "Potvrdi svoju email adresu za Disscount",
  heading: "Potvrdi svoju email adresu",
  intro:
    "Hvala na registraciji! Klikni na gumb ispod za potvrdu email adrese i aktivaciju Disscount računa.",
  buttonLabel: "Potvrdi email",
  buttonUrl: "https://disscount.me/api/auth/verify-email?token=preview",
  fallback: "Ako gumb ne radi, kopiraj i zalijepi poveznicu u preglednik.",
  footnote: "Ako ovaj račun nije tvoj, slobodno zanemari ovaj email.",
  footer: "Ovaj email primaš jer postoji račun povezan s ovom adresom.",
} satisfies IActionEmailProps;
