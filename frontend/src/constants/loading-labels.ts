/**
 * Pending copy for buttons that wait on a network or database call.
 *
 * Verbal noun plus ellipsis, matching the existing "Prijava..." wording. Keep
 * these short: they replace a button's label in place, and a longer string
 * would reflow a modal footer on a narrow phone.
 */
export const LOADING_LABELS = {
  saving: "Spremanje...",
  creating: "Stvaranje...",
  adding: "Dodavanje...",
  updating: "Ažuriranje...",
  deleting: "Brisanje...",
  restoring: "Vraćanje...",
  sending: "Slanje...",
  copying: "Kopiranje...",
  sharing: "Dijeljenje...",
  settingUp: "Postavljanje...",
  signingIn: "Prijava...",
  signingOut: "Odjava...",
  registering: "Registracija...",
  linking: "Povezivanje...",
  unlinking: "Odspajanje...",
} as const;
