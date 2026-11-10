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

interface IDetailPopoverButtonProps {
  id?: string;
  /** The button's accessible name, saying what it shows, such as "Otvoreno, zatvara uskoro u 21:00". */
  name: string;
  /** Hidden until asked for, such as "Zatvara u 21:00" or the nearest store's address. */
  detail: ReactNode;
  children: ReactNode;
}

function keepFocus(event: Event) {
  event.preventDefault();
}

/** One popover serves every pointer, since Radix tooltips ignore taps and a touch laptop reports a fine pointer. */
export default function DetailPopoverButton({
  id,
  name,
  detail,
  children,
}: IDetailPopoverButtonProps) {
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
    // The row or card header it sits in may itself open or toggle on a click.
    event.stopPropagation();
    // Hover already opened it, so a mouse click must not toggle it shut.
    if (pointerType.current === "mouse") event.preventDefault();
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* Above a row's full-size toggle; the tap area grows only upwards and down, clear of the name beside it. */}
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
          className="relative z-10 inline-flex cursor-pointer rounded-full after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        onOpenAutoFocus={keepFocus}
        onCloseAutoFocus={keepFocus}
        className="w-auto max-w-64 px-2 py-1 text-xs"
      >
        {detail}
      </PopoverContent>
    </Popover>
  );
}
