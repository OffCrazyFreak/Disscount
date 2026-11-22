import { screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { renderWithProviders } from "@/test/render";

function NameForm({ required }: { required?: boolean }) {
  const form = useForm({ defaultValues: { name: "" } });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem required={required}>
            <FormLabel>Naziv</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
}

describe("FormItem required", () => {
  it("stars the label for sight and tells screen readers once", () => {
    renderWithProviders(<NameForm required />);

    const field = screen.getByRole("textbox", { name: "Naziv" });

    expect(field).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("leaves an optional field unmarked", () => {
    renderWithProviders(<NameForm />);

    expect(screen.getByRole("textbox", { name: "Naziv" })).not.toHaveAttribute(
      "aria-required",
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });
});
