import { cn } from "@/lib/utils";

interface IBlockLoadingSpinnerProps {
  size?: number;
  className?: string;
}

/**
 * Pass `text-inherit` (or any text color) to recolor it inside buttons.
 *
 * The blocks travel x/y 1 to 23, so on a plain 24 viewBox they paint edge to
 * edge and read heavier than the Lucide icon they replace, whose stroke sits
 * inset by about an eighth on each side. The viewBox is padded to match that
 * inset optically, which holds at any rendered size: `size` sets the width and
 * height attributes, but inside a Button the size variant's `[&_svg]:size-*`
 * overrides both, so the correction cannot live in the caller's size prop.
 */
export default function BlockLoadingSpinner({
  size = 64,
  className,
}: IBlockLoadingSpinnerProps) {
  return (
    <div className={cn("inline-block text-primary", className)}>
      <svg
        width={size}
        height={size}
        viewBox="-2.67 -2.67 29.33 29.33"
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
