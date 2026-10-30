import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { textColorFor } from "@/utils/color-contrast";
import { cn } from "@/lib/utils";

import {
  CELL_HEIGHT,
  CELL_WIDTH,
  PICKER_HEIGHT,
  PICKER_WIDTH,
  type PICKER_CELLS,
} from "./picker-cells";

const HEX_POINTS = "21,0 42,12 42,36 21,48 0,36 0,12";
const RING_POINTS = "21,-5 46,9.5 46,38.5 21,53 -4,38.5 -4,9.5";
const FOCUS_POINTS = "21,-10 51,7 51,41 21,58 -9,41 -9,7";
const CHECK_PATH = "M13 24.5l5.5 5.5L29.5 19";

interface IColorHexCellProps {
  cell: (typeof PICKER_CELLS)[number];
  selected: boolean;
  tabbable: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export default function ColorHexCell({
  cell,
  selected,
  tabbable,
  onSelect,
  onKeyDown,
}: IColorHexCellProps) {
  const t = useTranslations("digitalCards.form");
  const tColors = useTranslations("digitalCards.colors");
  const { hex, id } = cell.color;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={t("colorOption", {
        name: tColors(`${id}.name`),
        hue: tColors(`${id}.hue`),
      })}
      tabIndex={tabbable ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        left: PICKER_WIDTH / 2 + cell.x - CELL_WIDTH / 2,
        top: PICKER_HEIGHT / 2 + cell.y - CELL_HEIGHT / 2,
      }}
      className={cn(
        "group absolute grid cursor-pointer place-items-center p-0 outline-none",
        "forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight]",
        "focus:z-10",
        selected && "z-10",
      )}
    >
      <svg
        viewBox="0 0 42 48"
        aria-hidden="true"
        className="pointer-events-none h-12 w-[42px] scale-[0.84] overflow-visible motion-safe:transition-transform motion-safe:group-hover:scale-[0.92]"
      >
        <polygon
          points={RING_POINTS}
          strokeWidth={3}
          strokeLinejoin="round"
          className="fill-none stroke-foreground opacity-0 group-aria-checked:opacity-100"
        />
        <polygon
          points={FOCUS_POINTS}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeDasharray="5 4"
          className="stroke-ring fill-none opacity-0 group-focus-visible:opacity-100"
        />
        {cell.needsDarkOutline && (
          <polygon
            points={HEX_POINTS}
            strokeWidth={7}
            strokeLinejoin="round"
            className="fill-none stroke-transparent dark:stroke-foreground/50"
          />
        )}
        <polygon
          points={HEX_POINTS}
          fill={hex}
          stroke={hex}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        {selected && (
          <path
            d={CHECK_PATH}
            fill="none"
            stroke={textColorFor(hex)}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
