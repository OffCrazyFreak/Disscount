import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface IPriceHistoryHeaderProps {
  isOpen: boolean;
}

export default function PriceHistoryHeader({
  isOpen,
}: IPriceHistoryHeaderProps) {
  const t = useTranslations("productDetail.priceHistory");

  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      <Separator className="flex-1 my-2" />

      <div className="flex items-center gap-4">
        <p className="hidden sm:inline text-gray-700 text-sm">
          {isOpen ? t("hide") : t("show")}
        </p>

        <ChevronDown
          className={cn(
            "size-8 text-gray-500 transition-transform flex-shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </div>
    </div>
  );
}
