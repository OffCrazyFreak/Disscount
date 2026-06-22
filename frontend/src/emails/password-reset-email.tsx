import ActionEmail from "./components/action-email";

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
      intro="Zatražio si ponovno postavljanje lozinke. Klikni na gumb ispod kako bi postavio novu lozinku. Poveznica vrijedi ograničeno vrijeme."
      buttonLabel="Postavi novu lozinku"
      buttonUrl={resetUrl}
      footnote="Ako nisi ti zatražio ovu promjenu, zanemari ovaj email — tvoja lozinka ostaje nepromijenjena."
    />
  );
}

PasswordResetEmail.PreviewProps = {
  resetUrl: "https://disscount.me/reset-password?token=preview",
} satisfies IPasswordResetEmailProps;
