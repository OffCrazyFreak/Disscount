import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/custom/form/multi-select";
import { renderWithProviders } from "@/test/render";

beforeAll(() => {
  // jsdom has no layout APIs; the popover and the list ask for these.
  window.matchMedia ??= vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= vi.fn();
});

const CHAINS = [
  { value: "konzum", label: "Konzum" },
  { value: "kaufland", label: "Kaufland" },
  { value: "lidl", label: "Lidl" },
  { value: "spar", label: "Spar", disabled: true },
];

function Harness({ onChange }: { onChange: (values: string[]) => void }) {
  const [values, setValues] = useState<string[]>([]);

  return (
    <MultiSelect
      values={values}
      onValuesChange={(next) => {
        setValues(next);
        onChange(next);
      }}
    >
      <MultiSelectTrigger aria-label="Lanci">
        <MultiSelectValue placeholder="Svi lanci" />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectGroup>
          {CHAINS.map((chain) => (
            <MultiSelectItem
              key={chain.value}
              value={chain.value}
              keywords={[chain.label]}
              disabled={chain.disabled}
            >
              {chain.label}
            </MultiSelectItem>
          ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
}

async function open() {
  const onChange = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<Harness onChange={onChange} />);
  await user.click(screen.getByRole("combobox", { name: "Lanci" }));
  return { onChange, user };
}

describe("MultiSelect bulk actions", () => {
  it("selects every enabled option, then clears them all", async () => {
    const { onChange, user } = await open();

    await user.click(screen.getByRole("button", { name: "Odaberi sve" }));
    expect(onChange).toHaveBeenLastCalledWith(["konzum", "kaufland", "lidl"]);

    await user.click(screen.getByRole("button", { name: "Ukloni sve" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("selects only the options matching the search", async () => {
    const { onChange, user } = await open();

    await user.type(screen.getByRole("combobox", { name: "" }), "ka");
    await user.click(screen.getByRole("button", { name: "Odaberi sve" }));

    expect(onChange).toHaveBeenLastCalledWith(["kaufland"]);
  });

  it("announces the new count to screen readers", async () => {
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: "Odaberi sve" }));

    expect(screen.getByRole("status")).toHaveTextContent("Odabrano: 3");
  });

  it("runs the focused button on Enter instead of picking a list option", async () => {
    const { onChange, user } = await open();

    screen.getByRole("button", { name: "Odaberi sve" }).focus();
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith(["konzum", "kaufland", "lidl"]);
  });
});
