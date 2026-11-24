import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Reauth } from "@/components/custom/settings/security/hooks/use-reauth";
import type { IProofFailure } from "@/components/custom/settings/security/reauth/reauth-requests";
import ReauthDialog from "@/components/custom/settings/security/reauth/reauth-dialog";
import hrSettings from "@/i18n/messages/hr/settings.json";
import { renderWithProviders } from "@/test/render";

function passwordReauth(failure: IProofFailure): Reauth {
  return {
    method: "password",
    request: {
      id: 1,
      title: "Obriši račun",
      description: "Trajno",
      confirmLabel: "Obriši",
      isDestructive: true,
      submit: vi.fn().mockResolvedValue(failure),
    },
    isOpen: true,
    delivery: "sent",
    resendAt: 0,
    ask: vi.fn(),
    withFreshSession: vi.fn(),
    resendCode: vi.fn(),
    close: vi.fn(),
  };
}

async function submitPasswordWith(failure: IProofFailure) {
  renderWithProviders(
    <ReauthDialog
      reauth={passwordReauth(failure)}
      email="ana@example.com"
      onForgotPassword={vi.fn()}
      isSendingRecovery={false}
    />,
  );

  const user = userEvent.setup();
  await user.type(document.getElementById("reauth-password")!, "pw");
  await user.click(screen.getByRole("button", { name: "Obriši" }));

  return screen.findByRole("alert");
}

describe("ReauthDialog", () => {
  it("tells the last admin why the account stays", async () => {
    const alert = await submitPasswordWith({ reason: "last-admin" });

    expect(alert).toHaveTextContent(
      hrSettings.security.actions.lastAdminDelete,
    );
  });

  it("keeps the generic message for any other failure", async () => {
    const alert = await submitPasswordWith({ reason: "failed" });

    expect(alert).toHaveTextContent(hrSettings.security.submit.generic);
  });
});
