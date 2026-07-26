import { Metadata } from "next";

import SpendingClient from "@/app/(user)/spending/components/spending-client";

export const metadata: Metadata = {
  title: "Potrošnja",
  description: "Pregled i analiza tvoje potrošnje.",
};

export default function SpendingPage() {
  return <SpendingClient />;
}
