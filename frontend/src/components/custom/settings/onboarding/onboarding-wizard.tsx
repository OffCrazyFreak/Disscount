"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import type { UserRequest } from "@/lib/api/schemas/auth-user";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";
import { WizardProgressDots } from "@/components/custom/settings/onboarding/wizard-progress-dots";
import { WizardStepPanel } from "@/components/custom/settings/onboarding/wizard-step-panel";
import { useOnboarding } from "@/components/custom/settings/onboarding/use-onboarding";

interface OnboardingWizardProps {
  open: boolean;
  save: (extraUserPatch?: Partial<UserRequest>) => Promise<boolean>;
  saving: boolean;
}

export function OnboardingWizard({ open, save, saving }: OnboardingWizardProps) {
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
        "Kratko postavljanje računa — sve se kasnije može promijeniti."
      }
      srOnlyDescription={!currentStep.description}
      preventClose={busy}
      headerExtra={
        <div className="pt-2">
          <WizardProgressDots
            count={ONBOARDING_STEPS.length}
            current={step}
          />
        </div>
      }
      footer={
        <div className="flex items-center gap-2 px-6 pb-6 pt-4">
          {!isLast && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void skip()}
              disabled={busy}
              className="text-muted-foreground"
            >
              Preskoči
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
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
