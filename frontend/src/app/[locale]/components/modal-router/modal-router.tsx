"use client";

import { Fragment } from "react";

import AuthModal from "@/components/custom/auth/auth-modal";
import EntityModalOutlet, {
  isEntityTarget,
} from "@/app/[locale]/components/modal-router/entity-modal-outlet";
import SettingsModalHost from "@/components/custom/settings/settings-modal-host";
import OnboardingGate from "@/components/custom/settings/onboarding/components/onboarding-gate";
import ProductActionsOutlet from "@/app/[locale]/components/modal-router/product-actions-outlet";
import PublicModalsOutlet from "@/app/[locale]/components/modal-router/public-modals-outlet";
import ShoppingListActionsOutlet from "@/app/[locale]/components/modal-router/shopping-list-actions-outlet";
import useAuthGate from "@/app/[locale]/components/modal-router/use-auth-gate";
import { useModalUrl } from "@/lib/modal/use-modal-url";
import { useUser } from "@/context/user-context";

export default function ModalRouter() {
  const { target } = useModalUrl();
  const {
    user,
    isAuthenticated,
    canShowAccountData: canOpenSavedEntities,
    isLoading,
  } = useUser();
  // Offline, a saved card still has to open at the till instead of asking for a login.
  const authGate = useAuthGate(
    target,
    isEntityTarget(target) ? canOpenSavedEntities : isAuthenticated,
    isLoading,
  );

  return (
    <>
      <AuthModal
        open={authGate.showAuthModal}
        mode={authGate.authMode}
        message={authGate.gateMessage}
        onOpenChange={authGate.handleAuthOpenChange}
        onModeChange={authGate.handleModeChange}
        onSuccess={authGate.handleAuthSuccess}
      />

      <PublicModalsOutlet target={target} />

      <ProductActionsOutlet target={target} />

      {canOpenSavedEntities && (
        <EntityModalOutlet target={isEntityTarget(target) ? target : null} />
      )}

      {user && (
        // Keyed by account, because a switch without a sign-out must not keep the last account's form values.
        <Fragment key={user.id}>
          <OnboardingGate />
          <SettingsModalHost />
          <ShoppingListActionsOutlet target={target} />
        </Fragment>
      )}
    </>
  );
}
