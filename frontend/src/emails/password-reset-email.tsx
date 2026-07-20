import ActionEmail from "@/emails/components/action-email";

interface IPasswordResetEmailProps {
  resetUrl: string;
}

export default function PasswordResetEmail({
  resetUrl,
}: IPasswordResetEmailProps) {
  return (
    <ActionEmail
      preview="Ponovno postavi svoju lozinku za Disscount"
      heading="Ponovno postavljanje lozinke"
      intro="Stigao je zahtjev za ponovno postavljanje tvoje lozinke. Klikni na gumb ispod za postavljanje nove lozinke. Poveznica vrijedi ograničeno vrijeme."
      buttonLabel="Postavi novu lozinku"
      buttonUrl={resetUrl}
      footnote="Ako ovaj zahtjev ne dolazi od tebe, zanemari ovaj email - tvoja lozinka ostaje nepromijenjena."
    />
  );
}

PasswordResetEmail.PreviewProps = {
  resetUrl: "https://disscount.me/reset-password?token=preview",
} satisfies IPasswordResetEmailProps;
