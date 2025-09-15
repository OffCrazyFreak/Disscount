import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function UserInventoryLayout({ children }: Props) {
  return <div className="max-w-3xl mx-auto">{children}</div>;
}
