"use client";

import { AuthModal, AuthMode } from "@/components/custom/header/forms/auth-modal";
import EntityModalOutlet, {
  isEntityTarget,
} from "@/components/custom/modal-router/entity-modal-outlet";
import SettingsModalHost from "@/components/custom/settings/settings-modal-host";
import { AUTH_MODAL_NAMES } from "@/lib/modal/modal-registry";
import { useModalUrl } from "@/lib/modal/use-modal-url";
import { useUser } from "@/context/user-context";

const AUTH_MODE_BY_NAME: Record<string, AuthMode> = {
  login: "login",
  signup: "signup",
  "forgot-password": "forgot",
};

const MODE_TO_TARGET_NAME = {
  login: "login",
  signup: "signup",
  forgot: "forgot-password",
} as const;

/**
 * The single global mount point for URL-driven modals (?modal=...). Rendered
 * once in the root layout under Suspense; every modal it owns exists exactly
 * once app-wide.
 */
export default function ModalRouter() {
  const { target, closeModal, swapModal } = useModalUrl();
  const { isAuthenticated, isLoading } = useUser();

  const isAuthTarget =
    !!target && (AUTH_MODAL_NAMES as readonly string[]).includes(target.name);

  // Protected modals opened while logged out show the login modal instead; the
  // modal param stays in the URL, so the intended modal appears after login.
  const needsAuthGate =
    !!target && !isAuthTarget && !isAuthenticated && !isLoading;

  const showAuthModal =
    (isAuthTarget && !isAuthenticated && !isLoading) || needsAuthGate;

  const authMode: AuthMode =
    (target && AUTH_MODE_BY_NAME[target.name]) ?? "login";

  return (
    <>
      <AuthModal
        open={showAuthModal}
        mode={authMode}
        onOpenChange={(open) => !open && closeModal()}
        onModeChange={(mode) => swapModal({ name: MODE_TO_TARGET_NAME[mode] })}
      />

      {isAuthenticated && (
        <>
          <SettingsModalHost />
          <EntityModalOutlet target={isEntityTarget(target) ? target : null} />
        </>
      )}
    </>
  );
}
