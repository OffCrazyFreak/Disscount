import { screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import QuantityInput from "@/app/[locale]/products/components/forms/quantity-input";
import { Form } from "@/components/ui/form";
import type { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";
import { renderWithProviders } from "@/test/render";

describe("QuantityInput", () => {
  it("hands the stepper's input the required and error state the form gives it", () => {
    const { result } = renderHook(() =>
      useForm<AddToListFormData>({ defaultValues: { amount: "0" } }),
    );
    result.current.setError("amount", {
      message: "products.validation.amountRange",
    });

    renderWithProviders(
      <Form {...result.current}>
        <QuantityInput formField={result.current} />
      </Form>,
    );

    const input = screen.getByRole("spinbutton", { name: /Količina/ });

    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
