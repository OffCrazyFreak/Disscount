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
      {/* A separator trails its crumb, so no wrapped line starts with one; a long crumb ends in an ellipsis. */}
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex min-w-0 max-w-full items-center gap-1.5"
          >
            {item.href ? (
              <Link
                href={item.href}
                className="truncate hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-foreground">
                {item.label}
              </span>
            )}

            {index < items.length - 1 && (
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
