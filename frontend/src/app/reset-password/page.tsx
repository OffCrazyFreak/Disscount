import { Metadata } from "next";

import ResetPasswordModal from "@/app/reset-password/reset-password-modal";

export const metadata: Metadata = {
  title: "Nova lozinka",
  description: "Postavi novu lozinku za svoj Disscount račun.",
};

interface IPageProps {
  searchParams?: Promise<{ token?: string; email?: string }>;
}

// The reset/set-password email link lands here as /reset-password?token=...&email=...
// (Better Auth appends &token=). The modal is rendered over the app, matching the auth dialogs.
export default async function ResetPasswordPage({ searchParams }: IPageProps) {
  const params = await searchParams;

  return (
    <ResetPasswordModal token={params?.token ?? ""} email={params?.email} />
  );
}
