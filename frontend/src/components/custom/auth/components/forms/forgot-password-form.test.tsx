import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ForgotPasswordForm from "@/components/custom/auth/components/forms/forgot-password-form";
import { renderWithProviders } from "@/test/render";

describe("ForgotPasswordForm", () => {
  it("announces the email error on the email input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm onBackToLogin={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Pošalji poveznicu" }));

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Upiši ispravan email");
  });
});
