import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

// Forwards the email link to ?modal=reset-password; the modal there captures the
// token and strips it from the URL, so it never lingers in history.
export default async function ResetPasswordPage(
  props: PageProps<"/[locale]/reset-password">,
) {
  const searchParams = await props.searchParams;
  const rawToken = searchParams.token;
  const token = Array.isArray(rawToken)
    ? (rawToken[0] ?? "")
    : (rawToken ?? "");

  const query = token
    ? `?modal=reset-password&token=${encodeURIComponent(token)}`
    : "?modal=reset-password";

  redirect({ href: `/${query}`, locale: await getLocale() });
}
