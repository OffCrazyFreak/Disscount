import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IStoreOptimizeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function StoreOptimizeSelect({
  value,
  onValueChange,
}: IStoreOptimizeSelectProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">Optimiziraj po</span>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full sm:w-60 bg-white" size="sm">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="products">Broj proizvoda</SelectItem>
          <SelectItem value="basket">Najjeftinija košarica</SelectItem>
          <SelectItem value="total">Zasebnim proizvodima</SelectItem>
          <SelectItem value="distance" disabled>
            <span className="flex items-center gap-2">
              Udaljenost
              <Badge className="text-[10px]">USKORO</Badge>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
