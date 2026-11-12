import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StepperNumberInput } from "@/components/custom/form/stepper-number-input";
import { renderWithProviders } from "@/test/render";

function renderStepper(value: string, onChange = vi.fn()) {
  renderWithProviders(
    <StepperNumberInput
      value={value}
      onChange={onChange}
      steps={{ primary: 0.5, secondary: 5 }}
      min={0}
      max={10}
      ariaLabel="Količina"
    />,
  );

  return onChange;
}

describe("StepperNumberInput", () => {
  it("names each step in the reader's decimal style", () => {
    renderStepper("1");

    expect(
      screen.getByRole("button", { name: "Povećaj za 0,5" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Smanji za 5" }),
    ).toBeInTheDocument();
  });

  it("steps from the current value", async () => {
    const user = userEvent.setup();
    const onChange = renderStepper("1");

    await user.click(screen.getByRole("button", { name: "Povećaj za 0,5" }));

    expect(onChange).toHaveBeenCalledWith("1.5");
  });

  it("clamps to the range instead of overshooting", async () => {
    const user = userEvent.setup();
    const onChange = renderStepper("8");

    await user.click(screen.getByRole("button", { name: "Povećaj za 5" }));

    expect(onChange).toHaveBeenCalledWith("10");
  });

  it("treats an empty field as zero", async () => {
    const user = userEvent.setup();
    const onChange = renderStepper("");

    await user.click(screen.getByRole("button", { name: "Smanji za 0,5" }));

    expect(onChange).toHaveBeenCalledWith("0");
  });
});
