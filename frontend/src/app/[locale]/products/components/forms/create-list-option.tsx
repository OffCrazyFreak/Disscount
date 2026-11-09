import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { CommandItem } from "@/components/ui/command";

interface ICreateListOptionProps {
  customListTitle: string;
  onSelect: () => void;
}

export default function CreateListOption({
  customListTitle,
  onSelect,
}: ICreateListOptionProps) {
  const t = useTranslations("products");

  const label = t.rich("createListOption.label", {
    title: customListTitle.trim(),
    name: (chunks) => <span className="truncate">{chunks}</span>,
  });

  return (
    <CommandItem
      value={`new-${customListTitle}`}
      // The list filters on keywords alone, so this needs its own; the title is the search text, so it always matches.
      keywords={[customListTitle]}
      onSelect={onSelect}
      className="text-nowrap"
    >
      <Plus className="size-4" />
      {/* One flex item: bare text nodes would each get the item's gap, spacing the quotes. */}
      <span className="flex min-w-0">{label}</span>
    </CommandItem>
  );
}
