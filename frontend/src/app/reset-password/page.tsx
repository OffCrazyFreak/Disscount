import { Metadata } from "next";

import ResetPasswordModal from "@/app/reset-password/reset-password-modal";

export const metadata: Metadata = {
  title: "Nova lozinka",
  description: "Postavi novu lozinku za svoj Disscount račun.",
};

interface IPageProps {
  searchParams?: Promise<{ token?: string | string[] }>;
}

// The reset/set-password email link lands here as /reset-password?token=... (Better Auth
// appends the token). The modal is rendered over the app, matching the auth dialogs.
export default async function ResetPasswordPage({ searchParams }: IPageProps) {
  const params = await searchParams;
  // Next can hand a repeated query param as an array — take the first value.
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "");

  return <ResetPasswordModal token={token} />;
}
