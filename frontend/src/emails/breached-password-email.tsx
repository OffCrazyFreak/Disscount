import ActionEmail from "@/emails/components/action-email";

interface IBreachedPasswordEmailProps {
  resetUrl: string;
}

export default function BreachedPasswordEmail({
  resetUrl,
}: IBreachedPasswordEmailProps) {
  return (
    <ActionEmail
      preview="Tvoju lozinku pronašli smo u curenju podataka, postavi novu"
      heading="Tvoja lozinka pronađena je u curenju podataka"
      intro="Upravo je stigao pokušaj prijave u tvoj Disscount račun s ispravnom lozinkom. Tu lozinku pronašli smo u poznatom curenju podataka s neke druge stranice, zato prijavu nismo dopustili. Postavi novu lozinku putem gumba ispod. Kad je postaviš, odjavit ćemo te sa svih uređaja. Poveznica vrijedi 30 minuta."
      buttonLabel="Postavi novu lozinku"
      buttonUrl={resetUrl}
      footnote="Ako to nisi ti, svejedno postavi novu lozinku. Ako ovu lozinku koristiš i drugdje, promijeni je i tamo."
    />
  );
}

BreachedPasswordEmail.PreviewProps = {
  resetUrl: "https://disscount.me/reset-password?token=preview",
} satisfies IBreachedPasswordEmailProps;
