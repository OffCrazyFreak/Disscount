"use client";

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

/**
 * The single global mount point for URL-driven modals (?modal=...). Rendered
 * once in the root layout under Suspense; every modal it owns exists exactly
 * once app-wide.
 */
export default function ModalRouter() {
  const { target } = useModalUrl();
  const { isAuthenticated, isLoading } = useUser();
  const authGate = useAuthGate(target, isAuthenticated, isLoading);

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

      {isAuthenticated && (
        <>
          <OnboardingGate />
          <SettingsModalHost />
          <EntityModalOutlet target={isEntityTarget(target) ? target : null} />
          <ShoppingListActionsOutlet target={target} />
        </>
      )}
    </>
  );
}
