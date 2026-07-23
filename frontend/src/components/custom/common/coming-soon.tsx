import { ReactNode } from "react";
import { Construction } from "lucide-react";

import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";

interface IComingSoonProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export default function ComingSoon({
  title,
  description = "Ova značajka je u izradi i bit će uskoro dostupna.",
  icon,
}: IComingSoonProps) {
  return (
    <div className="space-y-6">
      {title && <h1 className="text-3xl font-bold text-pretty">{title}</h1>}

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 px-6 text-center">
        {icon ?? <Construction className="size-12 text-primary" />}

        <ComingSoonBadge />

        <p className="max-w-md text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
