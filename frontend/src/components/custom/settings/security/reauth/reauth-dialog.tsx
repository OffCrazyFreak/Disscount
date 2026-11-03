"use client";

import { Check, KeyRound, Trash2, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/custom/modal/modal-shell";
import ConfirmDialogHero from "@/components/custom/modal/confirm-dialog-hero";
import type { Reauth } from "@/components/custom/settings/security/hooks/use-reauth";
import { proofFailureMessage } from "@/components/custom/settings/security/reauth/proof-failure-message";
import { useReauthForm } from "@/components/custom/settings/security/reauth/use-reauth-form";
import ReauthPasswordField from "@/components/custom/settings/security/reauth/reauth-password-field";
import ReauthCodeField from "@/components/custom/settings/security/reauth/reauth-code-field";

const FORM_ID = "reauth-form";
const ERROR_ID = "reauth-error";

interface IReauthDialogProps {
  reauth: Reauth;
  email: string;
  onForgotPassword: () => void;
  isSendingRecovery: boolean;
}

// The warning and the proof in one dialog: typing the password or code is the confirmation.
export default function ReauthDialog({
  reauth,
  email,
  onForgotPassword,
  isSendingRecovery,
}: IReauthDialogProps) {
  const t = useTranslations("settings");
  const form = useReauthForm(reauth);
  const { request } = reauth;

  if (!request) return null;

  const isDestructive = Boolean(request.isDestructive);
  const message = form.failure ? proofFailureMessage(form.failure) : null;
  const errorId = message ? ERROR_ID : undefined;

  return (
    <ModalShell
      open={reauth.isOpen}
      onOpenChange={(open) => !open && reauth.close()}
      size="sm"
      centered
      preventClose={form.submitting}
      title={request.title}
      description={request.description}
      hero={
        <ConfirmDialogHero
          icon={isDestructive ? TriangleAlert : KeyRound}
          isDestructive={isDestructive}
        />
      }
      footer={
        <div className="flex items-center justify-between gap-2 px-6 pb-6 pt-3">
          <Button
            variant="outline"
            icon={X}
            iconPlacement="left"
            onClick={reauth.close}
            disabled={form.submitting}
          >
            {t("security.reauth.cancel")}
          </Button>

          <Button
            type="submit"
            form={FORM_ID}
            variant={isDestructive ? "destructive" : "primary"}
            icon={isDestructive ? Trash2 : Check}
            iconPlacement="left"
            disabled={!form.isComplete}
            loading={form.submitting}
            loadingIconPlacement="left"
          >
            {request.confirmLabel}
          </Button>
        </div>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={form.handleSubmit}
        // Enter in the field never runs a destructive action; the red button is the one
        // deliberate step. Buttons keep Enter, or the resend link would stop working.
        onKeyDown={(event) => {
          if (
            isDestructive &&
            event.key === "Enter" &&
            event.target instanceof HTMLInputElement
          ) {
            event.preventDefault();
          }
        }}
        className="space-y-3"
      >
        {reauth.method === "password" ? (
          <ReauthPasswordField
            value={form.value}
            onChange={form.setValue}
            errorId={errorId}
            onForgotPassword={() => {
              reauth.close();
              onForgotPassword();
            }}
            isSendingRecovery={isSendingRecovery}
          />
        ) : (
          <ReauthCodeField
            email={email}
            value={form.value}
            onChange={form.setValue}
            errorId={errorId}
            delivery={reauth.delivery}
            resendAt={reauth.resendAt}
            onResend={() => {
              form.clearFailure();
              void reauth.resendCode();
            }}
          />
        )}

        {message && (
          <p id={ERROR_ID} role="alert" className="text-sm text-destructive">
            {t(message.key, "values" in message ? message.values : undefined)}
          </p>
        )}
      </form>
    </ModalShell>
  );
}
