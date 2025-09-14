import { ReactNode } from "react";

type Props = { children?: ReactNode };

export default function ProductsLayout({ children }: Props) {
  return <div className="max-w-3xl mx-auto">{children}</div>;
}
