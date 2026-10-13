/**
 * Keys into the `shell` namespace for pending copy on buttons that wait on a network or database call; translate with
 * `useTranslations("shell")` where rendered.
 *
 * Verbal noun plus ellipsis, matching the existing "Prijava..." wording. Keep
 * these short: they replace a button's label in place, and a longer string
 * would reflow a modal footer on a narrow phone.
 */
export const LOADING_LABELS = {
  saving: "loading.saving",
  creating: "loading.creating",
  adding: "loading.adding",
  updating: "loading.updating",
  deleting: "loading.deleting",
  restoring: "loading.restoring",
  sending: "loading.sending",
  copying: "loading.copying",
  sharing: "loading.sharing",
  settingUp: "loading.settingUp",
  signingIn: "loading.signingIn",
  signingOut: "loading.signingOut",
  registering: "loading.registering",
  linking: "loading.linking",
  unlinking: "loading.unlinking",
} as const;
