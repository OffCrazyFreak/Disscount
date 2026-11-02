import { zodResolver } from "@hookform/resolvers/zod";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import EmailField from "@/components/custom/auth/components/fields/email-field";
import { Form } from "@/components/ui/form";
import { renderWithProviders } from "@/test/render";

const schema = z.object({ email: z.email("auth.validation.emailInvalid") });

function EmailForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <EmailField control={form.control} name="email" />
        <button type="submit">Pošalji</button>
      </form>
    </Form>
  );
}

describe("EmailField", () => {
  it("is not marked invalid before validation runs", () => {
    renderWithProviders(<EmailForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("marks the input invalid and links the error text", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailForm />);

    await user.click(screen.getByRole("button", { name: "Pošalji" }));

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Unesi važeći email");
  });

  it("clears the error state once the email is valid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailForm />);

    await user.click(screen.getByRole("button", { name: "Pošalji" }));
    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Pošalji" }));

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAccessibleDescription("");
  });
});
