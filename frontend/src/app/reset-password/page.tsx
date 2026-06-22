import { Metadata } from "next";

import ResetPasswordModal from "@/app/reset-password/reset-password-modal";

export const metadata: Metadata = {
  title: "Nova lozinka",
  description: "Postavi novu lozinku za svoj Disscount račun.",
};

interface IPageProps {
  searchParams?: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: IPageProps) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const email = params?.email;

  return <ResetPasswordModal token={token} email={email} />;
}
