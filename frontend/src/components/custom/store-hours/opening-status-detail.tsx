"use client";

import {
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface IOpeningStatusDetailProps {
  id?: string;
  /** The full status, such as "Otvoreno, zatvara uskoro u 21:00". */
  name: string;
  /** The tooltip line, such as "Zatvara u 21:00". */
  detail: string;
  /** The badge. */
  children: ReactNode;
}

function keepFocus(event: Event) {
  event.preventDefault();
}

/**
 * Makes the badge a button that shows when the store opens or closes: on
 * hover, on keyboard focus and on tap. One popover serves every pointer,
 * since Radix tooltips ignore taps and a touch laptop reports a fine pointer.
 */
export default function OpeningStatusDetail({
  id,
  name,
  detail,
  children,
}: IOpeningStatusDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pointerType = useRef<string | null>(null);

  function hover(event: PointerEvent, open: boolean) {
    if (event.pointerType === "mouse") setIsOpen(open);
  }

  function focus(event: FocusEvent<HTMLButtonElement>) {
    // A tap also focuses the button; only keyboard focus should open it here.
    if (event.currentTarget.matches(":focus-visible")) setIsOpen(true);
  }

  function click(event: MouseEvent) {
    // The row a badge sits in may itself open or toggle on a click.
    event.stopPropagation();
    // Hover already opened it, so a mouse click must not toggle it shut.
    if (pointerType.current === "mouse") event.preventDefault();
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* Above a row's full-size toggle, with a tap area larger than the badge. */}
        <button
          type="button"
          id={id}
          aria-label={name}
          onPointerDown={(event) => (pointerType.current = event.pointerType)}
          onPointerEnter={(event) => hover(event, true)}
          onPointerLeave={(event) => hover(event, false)}
          onFocus={focus}
          onBlur={() => setIsOpen(false)}
          onClick={click}
          className="relative z-10 inline-flex rounded-full after:absolute after:-inset-x-2 after:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        onOpenAutoFocus={keepFocus}
        onCloseAutoFocus={keepFocus}
        className="w-auto px-2 py-1 text-xs"
      >
        {detail}
      </PopoverContent>
    </Popover>
  );
}
