import { Metadata } from "next";
import CodeLabClient from "./components/code-lab-client";

export const metadata: Metadata = {
  title: "Code Lab",
  description: "Internal playground for barcode and QR scanning and generation.",
  robots: { index: false, follow: false },
};

export default function CodeLabPage() {
  return <CodeLabClient />;
}
