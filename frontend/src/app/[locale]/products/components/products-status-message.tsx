import type { ReactNode } from "react";

interface IProductsStatusMessageProps {
  icon: ReactNode;
  title: string;
  text: string;
}

export default function ProductsStatusMessage({
  icon,
  title,
  text,
}: IProductsStatusMessageProps) {
  return (
    <div className="text-center py-12">
      {icon}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{text}</p>
    </div>
  );
}
