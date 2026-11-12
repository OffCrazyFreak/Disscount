interface IPriceRangeSpansProps {
  low: string;
  high: string;
  isSingle: boolean;
}

export default function PriceRangeSpans({
  low,
  high,
  isSingle,
}: IPriceRangeSpansProps) {
  if (isSingle) return <span className="text-gray-700">{low}</span>;

  return (
    <>
      <span className="text-green-700">{low}</span>
      <span className="text-gray-700"> - </span>
      <span className="text-red-700">{high}</span>
    </>
  );
}
