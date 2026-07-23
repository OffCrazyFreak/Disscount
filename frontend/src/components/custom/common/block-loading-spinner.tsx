import { cn } from "@/lib/utils";

interface IBlockLoadingSpinnerProps {
  size?: number;
  className?: string;
}

// Pass `text-inherit` (or any text color) to recolor it inside buttons.
export default function BlockLoadingSpinner({
  size = 64,
  className,
}: IBlockLoadingSpinnerProps) {
  return (
    <div className={cn("px-1 inline-block text-primary", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect
          className="spinner_9y7u"
          x="1"
          y="1"
          rx="1"
          width="10"
          height="10"
          fill="currentColor"
        />
        <rect
          className="spinner_9y7u spinner_DF2s"
          x="1"
          y="1"
          rx="1"
          width="10"
          height="10"
          fill="currentColor"
        />
        <rect
          className="spinner_9y7u spinner_q27e"
          x="1"
          y="1"
          rx="1"
          width="10"
          height="10"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
