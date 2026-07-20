import ActionEmail from "@/emails/components/action-email";

interface IVerificationEmailProps {
  verificationUrl: string;
}

export default function VerificationEmail({
  verificationUrl,
}: IVerificationEmailProps) {
  return (
    <ActionEmail
      preview="Potvrdi svoju email adresu za Disscount"
      heading="Potvrdi svoju email adresu"
      intro="Hvala na registraciji! Klikni na gumb ispod za potvrdu email adrese i aktivaciju Disscount računa."
      buttonLabel="Potvrdi email"
      buttonUrl={verificationUrl}
      footnote="Ako ovaj račun nije tvoj, slobodno zanemari ovaj email."
    />
  );
}

VerificationEmail.PreviewProps = {
  verificationUrl: "https://disscount.me/api/auth/verify-email?token=preview",
} satisfies IVerificationEmailProps;
