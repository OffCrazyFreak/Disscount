"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";
import WizardProgressDots from "@/components/custom/settings/onboarding/components/wizard-progress-dots";
import WizardStepPanel from "@/components/custom/settings/onboarding/components/wizard-step-panel";
import { useOnboarding } from "@/components/custom/settings/onboarding/hooks/use-onboarding";

interface IOnboardingWizardProps {
  open: boolean;
  mode: "required" | "replay";
  save: () => Promise<boolean>;
  saving: boolean;
}

export default function OnboardingWizard({
  open,
  mode,
  save,
  saving,
}: IOnboardingWizardProps) {
  const {
    step,
    direction,
    currentStep,
    isLast,
    isFirst,
    next,
    back,
    finish,
    rootError,
  } = useOnboarding({ open, save });

  const StepComponent = currentStep.component;
  const busy = saving;
  const required = mode === "required";

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !required) closeModalUrl();
      }}
      title={currentStep.title}
      description={
        currentStep.description ??
        "Kratko postavljanje računa, sve se kasnije može promijeniti."
      }
      srOnlyDescription={!currentStep.description}
      preventClose={required || busy}
      onSubmit={() => void (isLast ? finish() : next())}
      submitDisabled={busy}
      headerExtra={
        <div className="pt-2">
          <WizardProgressDots count={ONBOARDING_STEPS.length} current={step} />
        </div>
      }
      footer={
        // Same left/right split as ModalShellFooter.
        <div className="flex items-center gap-2 px-6 pb-6 pt-4">
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={busy}
              icon={ArrowLeft}
              iconPlacement="left"
            >
              Natrag
            </Button>
          )}

          <div className="ml-auto">
            {isLast ? (
              <Button
                type="button"
                onClick={() => void finish()}
                loading={saving}
                disabled={busy}
                icon={Check}
                iconPlacement="left"
              >
                Završi
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void next()}
                disabled={busy}
                icon={ArrowRight}
                iconPlacement="right"
              >
                Dalje
              </Button>
            )}
          </div>
        </div>
      }
    >
      {rootError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {rootError}
        </div>
      )}

      <WizardStepPanel stepId={currentStep.id} direction={direction}>
        <StepComponent />
      </WizardStepPanel>
    </ModalShell>
  );
}
