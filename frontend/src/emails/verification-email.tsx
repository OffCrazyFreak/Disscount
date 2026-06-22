import ActionEmail from "./components/action-email";

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
      intro="Hvala na registraciji! Klikni na gumb ispod kako bi potvrdio svoju email adresu i aktivirao svoj račun."
      buttonLabel="Potvrdi email"
      buttonUrl={verificationUrl}
      footnote="Ako nisi ti napravio ovaj račun, slobodno zanemari ovaj email."
    />
  );
}

VerificationEmail.PreviewProps = {
  verificationUrl: "https://disscount.me/api/auth/verify-email?token=preview",
} satisfies IVerificationEmailProps;
