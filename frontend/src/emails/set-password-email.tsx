import ActionEmail from "@/emails/components/action-email";

interface ISetPasswordEmailProps {
  setPasswordUrl: string;
}

// Sent when someone registers with an email that already has an OAuth-only account
// (Google/Facebook) but no password. Wording reads as "finish setting up" rather than
// "reset", since they are adding email/password login for the first time.
export default function SetPasswordEmail({
  setPasswordUrl,
}: ISetPasswordEmailProps) {
  return (
    <ActionEmail
      preview="Postavi lozinku za svoj Disscount račun"
      heading="Postavi lozinku za svoj račun"
      intro="Za ovu email adresu već postoji Disscount račun (prijava putem Googlea ili Facebooka). Klikni na gumb ispod kako bi postavio/la lozinku i ubuduće se mogao/la prijaviti i emailom. Poveznica vrijedi ograničeno vrijeme."
      buttonLabel="Postavi lozinku"
      buttonUrl={setPasswordUrl}
      footnote="Ako nisi ti zatražio/la ovo, zanemari ovaj email - tvoj račun ostaje nepromijenjen."
    />
  );
}

SetPasswordEmail.PreviewProps = {
  setPasswordUrl: "https://disscount.me/reset-password?token=preview",
} satisfies ISetPasswordEmailProps;
