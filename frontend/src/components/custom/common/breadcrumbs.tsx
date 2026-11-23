import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

interface IBreadcrumb {
  label: string;
  /** Left out on the last crumb, the page the reader is on. */
  href?: string;
}

interface IBreadcrumbsProps {
  label: string;
  items: IBreadcrumb[];
}

export default function Breadcrumbs({ label, items }: IBreadcrumbsProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight aria-hidden="true" className="size-3.5" />
            )}

            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
