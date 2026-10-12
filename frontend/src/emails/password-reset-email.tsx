import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

export default function PasswordResetEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

PasswordResetEmail.PreviewProps = {
  locale: "hr",
  preview: "Ponovno postavi svoju lozinku za Disscount",
  heading: "Ponovno postavljanje lozinke",
  intro:
    "Stigao je zahtjev za ponovno postavljanje tvoje lozinke. Klikni na gumb ispod za postavljanje nove lozinke.",
  buttonLabel: "Postavi novu lozinku",
  buttonUrl: "https://disscount.me/reset-password?token=preview",
  fallback: "Ako gumb ne radi, kopiraj i zalijepi poveznicu u preglednik.",
  footnote:
    "Ako ovaj zahtjev ne dolazi od tebe, zanemari ovaj email - tvoja lozinka ostaje nepromijenjena.",
  footer: "Ovaj email primaš jer postoji račun povezan s ovom adresom.",
} satisfies IActionEmailProps;
