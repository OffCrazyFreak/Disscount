import ActionEmail from "@/emails/components/action-email";

interface IChangeEmailConfirmationProps {
  confirmUrl: string;
  newEmail: string;
}

// Goes to the CURRENT address, so a hijacked session can't move the account.
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
          Klikni na gumb ispod za potvrdu promjene.
        </>
      }
      buttonLabel="Potvrdi promjenu"
      buttonUrl={confirmUrl}
      footnote="Ako ova promjena ne dolazi od tebe, odmah promijeni lozinku i javi nam se - tvoja adresa ostaje nepromijenjena dok ne potvrdiš."
    />
  );
}

ChangeEmailConfirmation.PreviewProps = {
  confirmUrl: "https://disscount.me/api/auth/verify-email?token=preview",
  newEmail: "nova@email.com",
} satisfies IChangeEmailConfirmationProps;
