import { redirect } from "next/navigation";

// Forwards the email link to ?modal=reset-password, keeping auth in one place.
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
