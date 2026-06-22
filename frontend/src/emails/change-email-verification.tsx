import ActionEmail from "./components/action-email";

interface IChangeEmailVerificationProps {
  confirmUrl: string;
  newEmail: string;
}

export default function ChangeEmailVerification({
  confirmUrl,
  newEmail,
}: IChangeEmailVerificationProps) {
  return (
    <ActionEmail
      preview="Potvrdi promjenu email adrese"
      heading="Potvrdi promjenu email adrese"
      intro={
        <>
          Zatražena je promjena email adrese tvog računa na{" "}
          <span className="font-semibold text-gray-800">{newEmail}</span>.
          Klikni na gumb ispod kako bi potvrdio promjenu.
        </>
      }
      buttonLabel="Potvrdi promjenu"
      buttonUrl={confirmUrl}
      footnote="Ako nisi ti zatražio ovu promjenu, odmah promijeni lozinku i javi nam se."
    />
  );
}

ChangeEmailVerification.PreviewProps = {
  confirmUrl: "https://disscount.me/api/auth/verify-email?token=preview",
  newEmail: "nova@email.com",
} satisfies IChangeEmailVerificationProps;
