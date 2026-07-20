import ActionEmail from "@/emails/components/action-email";

interface IChangeEmailConfirmationProps {
  confirmUrl: string;
  newEmail: string;
}

// Sent to the user's CURRENT address to approve a change before it applies, so a hijacked
// session can't silently move the account to an attacker's email.
export default function ChangeEmailConfirmation({
  confirmUrl,
  newEmail,
}: IChangeEmailConfirmationProps) {
  return (
    <ActionEmail
      preview="Potvrdi promjenu email adrese"
      heading="Potvrdi promjenu email adrese"
      intro={
        <>
          Zatražena je promjena email adrese tvog Disscount računa na{" "}
          <span className="font-semibold text-gray-800">{newEmail}</span>.
          Klikni na gumb ispod kako bi potvrdio/la promjenu.
        </>
      }
      buttonLabel="Potvrdi promjenu"
      buttonUrl={confirmUrl}
      footnote="Ako nisi ti zatražio/la ovu promjenu, odmah promijeni lozinku i javi nam se - tvoja adresa ostaje nepromijenjena dok ne potvrdiš."
    />
  );
}

ChangeEmailConfirmation.PreviewProps = {
  confirmUrl: "https://disscount.me/api/auth/verify-email?token=preview",
  newEmail: "nova@email.com",
} satisfies IChangeEmailConfirmationProps;
