import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
      {/* One line: the current page's crumb gives way first, so a long product name ends in an ellipsis. */}
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-1.5",
              item.href ? "shrink-0" : "min-w-0",
            )}
          >
            {index > 0 && (
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            )}

            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
