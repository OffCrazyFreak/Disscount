"use client";

import { usePathname } from "next/navigation";

export default function NotFoundClient() {
  const pathname = usePathname();

  return <span className="italic"> &quot;{pathname}&quot; </span>;
}
