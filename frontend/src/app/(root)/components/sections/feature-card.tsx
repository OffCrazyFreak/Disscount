import Link from "next/link";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import FeatureCardAction from "@/app/(root)/components/sections/feature-card-action";
import { cn } from "@/lib/utils";
import type { IFeatureItem } from "@/app/(root)/components/data/features";

interface IFeatureCardProps {
  feature: IFeatureItem;
}

export default function FeatureCard({ feature }: IFeatureCardProps) {
  const Icon = feature.icon;
  const clickable = Boolean(feature.href || feature.action);

  const cardClass = cn(
    "relative flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md",
    feature.comingSoon && "border-dashed",
    clickable && "cursor-pointer",
  );

  const content = (
    <>
      {feature.comingSoon && (
        <ComingSoonBadge className="absolute -top-2.5 -right-2 rotate-6" />
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

        <h3 className="font-semibold text-pretty">{feature.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground text-pretty">
        {feature.description}
      </p>
    </>
  );

  if (feature.href) {
    return (
      <Link href={feature.href} className={cardClass}>
        {content}
      </Link>
    );
  }

  if (feature.action) {
    return (
      <FeatureCardAction action={feature.action} className={cardClass}>
        {content}
      </FeatureCardAction>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
