import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// For an OAuth-only account adding a password, so it reads "set", not "reset".
export default function SetPasswordEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

SetPasswordEmail.PreviewProps = {
  locale: "hr",
  preview: "Postavi lozinku za svoj Disscount račun",
  heading: "Postavi lozinku za svoj račun",
  intro:
    "Za ovu email adresu već postoji Disscount račun. Klikni na gumb ispod za postavljanje lozinke.",
  buttonLabel: "Postavi lozinku",
  buttonUrl: "https://disscount.me/reset-password?token=preview",
  fallback: "Ako gumb ne radi, kopiraj i zalijepi poveznicu u preglednik.",
  footnote:
    "Ako ovaj zahtjev ne dolazi od tebe, zanemari ovaj email - tvoj račun ostaje nepromijenjen.",
  footer: "Ovaj email primaš jer postoji račun povezan s ovom adresom.",
} satisfies IActionEmailProps;
