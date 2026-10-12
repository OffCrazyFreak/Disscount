"use client";


import { usePathname } from "@/i18n/navigation";
export default function NotFoundClient() {
  const pathname = usePathname();

  return <span className="italic"> &quot;{pathname}&quot; </span>;
}
