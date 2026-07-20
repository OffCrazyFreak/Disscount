import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import { cn } from "@/lib/utils";
import type { IFeatureItem } from "@/app/(root)/components/data/features";

interface IFeatureCardProps {
  feature: IFeatureItem;
}

export default function FeatureCard({ feature }: IFeatureCardProps) {
  const Icon = feature.icon;

  return (
    <div
      className={cn(
        "relative h-full bg-card border rounded-2xl p-5 space-y-3 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md",
        feature.comingSoon && "border-dashed",
      )}
    >
      {feature.comingSoon && (
        <ComingSoonBadge className="absolute -top-2.5 -right-2 rotate-6 shadow-sm" />
      )}

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "size-11 shrink-0 grid place-items-center rounded-xl",
            feature.comingSoon
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-6" />
        </div>

        <h3 className="font-semibold">{feature.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground text-pretty">
        {feature.description}
      </p>
    </div>
  );
}
