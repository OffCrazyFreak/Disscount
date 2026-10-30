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
      // The list filters on keywords alone, so this needs its own. The search
      // text and this title are the same field, so it always matches.
      keywords={[customListTitle]}
      onSelect={onSelect}
      className="text-nowrap"
    >
      <Plus className="size-4" />
      {label}
    </CommandItem>
  );
}
