import type { KeyboardEvent } from "react";

import { nextCellIndex } from "../../../utils/hex-grid";
import ColorHexCell from "./color-hex-cell";
import { PICKER_CELLS, PICKER_HEIGHT, PICKER_WIDTH } from "./picker-cells";

const ARROW_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
const NAVIGATION_KEYS = [...ARROW_KEYS, "Home", "End"];

interface ICardColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  labelledBy?: string;
}

export default function CardColorPicker({
  value,
  onChange,
  labelledBy,
}: ICardColorPickerProps) {
  const selectedIndex = PICKER_CELLS.findIndex(
    (cell) => cell.color.hex.toLowerCase() === value.toLowerCase(),
  );
  const tabbableIndex = Math.max(selectedIndex, 0);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!NAVIGATION_KEYS.includes(event.key)) return;

    event.preventDefault();

    const next = nextCellIndex(PICKER_CELLS, index, event.key);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      );

    buttons?.[next]?.focus();
    onChange(PICKER_CELLS[next].color.hex);
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="relative mx-auto"
      style={{ width: PICKER_WIDTH, height: PICKER_HEIGHT }}
    >
      {PICKER_CELLS.map((cell, index) => (
        <ColorHexCell
          key={cell.color.hex}
          cell={cell}
          selected={index === selectedIndex}
          tabbable={index === tabbableIndex}
          onSelect={() => onChange(cell.color.hex)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        />
      ))}
    </div>
  );
}
