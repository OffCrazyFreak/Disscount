"use client";

import { ReactNode } from "react";

interface INoResultsProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function NoResults({
  icon,
  title = "Nema rezultata",
  description = "Probaj s drugim pojmom za pretraživanje",
  className = "",
}: INoResultsProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-pretty">
        {title}
      </h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
