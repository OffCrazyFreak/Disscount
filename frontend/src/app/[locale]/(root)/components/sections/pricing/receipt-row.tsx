interface IReceiptRowProps {
  label: string;
  price: string;
}

export default function ReceiptRow({ label, price }: IReceiptRowProps) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span className="text-pretty">{label}</span>
      <span className="flex-1 border-b border-dotted border-muted-foreground/40" />
      <span className="font-mono text-pretty">{price}</span>
    </li>
  );
}
