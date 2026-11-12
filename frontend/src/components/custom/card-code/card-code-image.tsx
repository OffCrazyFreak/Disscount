import type { CSSProperties } from "react";

interface ICardCodeImageProps {
  svg: string;
  label: string;
  style: CSSProperties;
}

export default function CardCodeImage({
  svg,
  label,
  style,
}: ICardCodeImageProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className="[&>svg]:size-full"
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
