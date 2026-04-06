import { TriangleAlert } from "lucide-react";

interface IFormWarningProps {
  title?: string;
  text?: string;
}

export default function FormWarning({ title, text }: IFormWarningProps) {
  if (!title && !text) {
    return null;
  }

  return (
    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-4">
        <TriangleAlert className="size-10 shrink-0 text-amber-600" />

        <div className="space-y-1">
          {title && <h4 className="text-sm text-amber-600">{title}</h4>}
          {text && (
            <p className="text-xs text-amber-900 text-justify">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
