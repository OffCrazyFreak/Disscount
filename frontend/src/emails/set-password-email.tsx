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
      intro="Za ovu email adresu već postoji Disscount račun (prijava putem Googlea ili Facebooka). Klikni na gumb ispod za postavljanje lozinke i prijavu emailom ubuduće. Poveznica vrijedi ograničeno vrijeme."
      buttonLabel="Postavi lozinku"
      buttonUrl={setPasswordUrl}
      footnote="Ako ovaj zahtjev ne dolazi od tebe, zanemari ovaj email - tvoj račun ostaje nepromijenjen."
    />
  );
}

SetPasswordEmail.PreviewProps = {
  setPasswordUrl: "https://disscount.me/reset-password?token=preview",
} satisfies ISetPasswordEmailProps;
