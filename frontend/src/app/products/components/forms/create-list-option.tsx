import { Plus } from "lucide-react";
import { CommandItem } from "@/components/ui/command";

interface ICreateListOptionProps {
  customListTitle: string;
  onSelect: () => void;
}

export default function CreateListOption({
  customListTitle,
  onSelect,
}: ICreateListOptionProps) {
  return (
    <CommandItem
      value={`new-${customListTitle}`}
      onSelect={onSelect}
      className="text-nowrap"
    >
      <Plus className="size-4" />
      Stvori &ldquo;
      <span className="truncate">{customListTitle.trim()}</span>
      &rdquo;
    </CommandItem>
  );
}
