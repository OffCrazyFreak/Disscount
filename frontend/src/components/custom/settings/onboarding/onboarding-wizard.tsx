"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import type { UserRequest } from "@/lib/api/schemas/auth-user";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";
import WizardProgressDots from "@/components/custom/settings/onboarding/components/wizard-progress-dots";
import WizardStepPanel from "@/components/custom/settings/onboarding/components/wizard-step-panel";
import { useOnboarding } from "@/components/custom/settings/onboarding/hooks/use-onboarding";

interface IOnboardingWizardProps {
  open: boolean;
  save: (extraUserPatch?: Partial<UserRequest>) => Promise<boolean>;
  saving: boolean;
}

export default function OnboardingWizard({
  open,
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
    skip,
    skipping,
  } = useOnboarding({ open, save });

  const StepComponent = currentStep.component;
  const busy = saving || skipping;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => {
        // Closing with X/ESC counts as skipping at the current step.
        if (!isOpen) void skip();
      }}
      title={currentStep.title}
      description={
        currentStep.description ??
        "Kratko postavljanje računa, sve se kasnije može promijeniti."
      }
      srOnlyDescription={!currentStep.description}
      preventClose={busy}
      headerExtra={
        <div className="pt-2">
          <WizardProgressDots count={ONBOARDING_STEPS.length} current={step} />
        </div>
      }
      footer={
        // Same left/right split as ModalShellFooter: back on the left, the
        // primary next/finish action pushed to the right with ml-auto.
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
      <WizardStepPanel stepId={currentStep.id} direction={direction}>
        <StepComponent />
      </WizardStepPanel>
    </ModalShell>
  );
}
