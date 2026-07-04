import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ResetPasswordModal from "@/app/reset-password/reset-password-modal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.resetPassword");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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
