"use client";

import {
  CircleAlert,
  CircleCheck,
  LogIn,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { closeModalUrl, swapModalUrl } from "@/lib/modal/modal-navigation";
import type { ModalTarget } from "@/lib/modal/modal-registry";
import { useUser } from "@/context/user-context";

type StatusKind = "email-verified" | "email-changed";

const STATUS_COPY = {
  "email-verified": {
    title: "statusModal.emailVerified.title",
    description: "statusModal.emailVerified.description",
  },
  "email-changed": {
    title: "statusModal.emailChanged.title",
    description: "statusModal.emailChanged.description",
  },
} as const satisfies Record<StatusKind, { title: string; description: string }>;

// A sign-in re-sends the verification link; a new change starts from security settings.
const FAILURE_STEP = {
  "email-verified": {
    title: "statusModal.linkFailed.title",
    description: "statusModal.linkFailed.emailVerifiedDescription",
    submit: "statusModal.linkFailed.signIn",
    submitIcon: LogIn,
    target: { name: "login" },
  },
  "email-changed": {
    title: "statusModal.linkFailed.title",
    description: "statusModal.linkFailed.emailChangedDescription",
    submit: "statusModal.linkFailed.openSettings",
    submitIcon: Settings,
    target: { name: "settings", tab: "sigurnost" },
  },
} as const satisfies Record<
  StatusKind,
  {
    title: string;
    description: string;
    submit: string;
    submitIcon: LucideIcon;
    target: ModalTarget;
  }
>;

interface IAuthStatusModalProps {
  open: boolean;
  kind: StatusKind;
  // better-auth's error code when the link expired, was reused or is invalid.
  linkError?: string;
}

// Reached via ?modal=email-verified|email-changed after the redirect; on success Better
// Auth already signed them in on the way back, so this only confirms.
export default function AuthStatusModal({
  open,
  kind,
  linkError,
}: IAuthStatusModalProps) {
  const t = useTranslations("auth");
  const { refreshUser, isAuthenticated, isLoading } = useUser();

  function handleContinue() {
    // Pull the freshly verified/updated identity before closing.
    void refreshUser();
    closeModalUrl();
  }

  if (linkError) {
    const failure = FAILURE_STEP[kind];
    // Signed in means the address is already verified, so there is nothing to resend.
    const isAlreadyVerified = kind === "email-verified" && isAuthenticated;
    const nextStep = isAlreadyVerified
      ? closeModalUrl
      : () => swapModalUrl(failure.target);

    return (
      <ModalShell
        open={open}
        onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
        size="sm"
        centered
        title={t(failure.title)}
        description={t(failure.description)}
        hero={
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <CircleAlert className="size-6" />
          </div>
        }
        submitLabel={t(
          isAlreadyVerified ? "statusModal.continue" : failure.submit,
        )}
        submitIcon={isAlreadyVerified ? CircleCheck : failure.submitIcon}
        // Until the session loads, the signed-in branch is unknown.
        submitDisabled={isLoading}
        onSubmit={nextStep}
      />
    );
  }

  const copy = STATUS_COPY[kind];

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleContinue()}
      size="sm"
      centered
      title={t(copy.title)}
      description={t(copy.description)}
      hero={
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleCheck className="size-6" />
        </div>
      }
      submitLabel={t("statusModal.continue")}
      submitIcon={CircleCheck}
      onSubmit={handleContinue}
    />
  );
}
