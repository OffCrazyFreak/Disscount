import { Metadata } from "next";

import SpendingClient from "@/app/[locale]/(user)/spending/components/spending-client";
import { pageMetadata } from "@/i18n/alternates";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("spending", "/spending");
}

export default function SpendingPage() {
  return <SpendingClient />;
}
