import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModalRouter from "@/app/[locale]/components/modal-router/modal-router";

const { session } = vi.hoisted(() => ({
  session: { user: { id: "account-a" } as { id: string } | null },
}));

vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    user: session.user,
    isAuthenticated: true,
    canShowAccountData: true,
    isLoading: false,
  }),
}));
vi.mock("@/lib/modal/use-modal-url", () => ({
  useModalUrl: () => ({ target: null }),
}));
vi.mock("@/app/[locale]/components/modal-router/use-auth-gate", () => ({
  default: () => ({ showAuthModal: false }),
}));
vi.mock("@/components/custom/auth/auth-modal", () => ({ default: () => null }));
vi.mock("@/app/[locale]/components/modal-router/public-modals-outlet", () => ({
  default: () => null,
}));
vi.mock(
  "@/app/[locale]/components/modal-router/product-actions-outlet",
  () => ({ default: () => null }),
);
vi.mock("@/app/[locale]/components/modal-router/entity-modal-outlet", () => ({
  default: () => null,
  isEntityTarget: () => false,
}));
vi.mock(
  "@/app/[locale]/components/modal-router/shopping-list-actions-outlet",
  () => ({ default: () => null }),
);
vi.mock(
  "@/components/custom/settings/onboarding/components/onboarding-gate",
  () => ({ default: () => null }),
);
// Stands in for the settings form: state seeded once on mount, like useForm's defaults.
vi.mock("@/components/custom/settings/settings-modal-host", () => ({
  default: function SeededOnMount() {
    const [seededFor] = useState(session.user?.id ?? "seeded with no profile");
    return <p>{seededFor}</p>;
  },
}));

describe("ModalRouter", () => {
  beforeEach(() => {
    session.user = { id: "account-a" };
  });

  it("starts the settings form over when another account signs in", () => {
    const { rerender } = render(<ModalRouter />);
    expect(screen.getByText("account-a")).toBeInTheDocument();

    act(() => {
      session.user = { id: "account-b" };
    });
    rerender(<ModalRouter />);

    expect(screen.getByText("account-b")).toBeInTheDocument();
  });

  it("does not seed the settings form while the new account's profile loads", () => {
    session.user = null;

    render(<ModalRouter />);

    expect(screen.queryByText("seeded with no profile")).toBeNull();
  });
});
