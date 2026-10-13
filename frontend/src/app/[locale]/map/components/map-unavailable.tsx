import { MapPinOff } from "lucide-react";

interface IMapUnavailableProps {
  message: string;
  action?: { label: string; onClick: () => void };
}

/** Stands in for the map; the store list keeps working beside it. */
export default function MapUnavailable({
  message,
  action,
}: IMapUnavailableProps) {
  return (
    <div
      role="status"
      className="flex h-full flex-col items-center justify-center gap-3 bg-muted p-6 text-center text-sm text-muted-foreground"
    >
      <MapPinOff className="size-10" aria-hidden="true" />

      <p className="max-w-xs text-pretty">{message}</p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-lg border bg-background px-4 py-2 font-medium text-foreground hover:bg-accent"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
