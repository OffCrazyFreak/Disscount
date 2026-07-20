import { redirect } from "next/navigation";

// Better Auth's reset/set-password email links land here as
// /reset-password?token=... We forward to the homepage and open the reset modal
// there, so the whole auth flow lives in one place (?modal=reset-password). The
// modal captures the token and strips it from the URL on arrival.
export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const searchParams = await props.searchParams;
  const rawToken = searchParams.token;
  const token = Array.isArray(rawToken)
    ? (rawToken[0] ?? "")
    : (rawToken ?? "");

  const query = token
    ? `?modal=reset-password&token=${encodeURIComponent(token)}`
    : "?modal=reset-password";

  redirect(`/${query}`);
}
