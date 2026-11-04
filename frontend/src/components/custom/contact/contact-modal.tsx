"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import ContactChannels from "@/components/custom/contact/contact-channels";
import ContactFormFields from "@/components/custom/contact/contact-form-fields";
import { contactService } from "@/lib/api";
import {
  ContactMessageRequest,
  contactMessageRequestSchema,
} from "@/lib/api/types";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useUser } from "@/context/user-context";
import { GITHUB_REPO_URL } from "@/constants/contact";

const EMPTY_VALUES: ContactMessageRequest = {
  email: "",
  fullName: "",
  subject: "",
  message: "",
  sourcePath: "",
  honeypot: "",
};

const DRAFT_KEY = "contact";

// Module level, so the prefill effect and reset handler share one source without an object changing identity on every render.
function profileValues(
  user: { email?: string | null; name?: string | null } | null | undefined,
): ContactMessageRequest {
  return {
    ...EMPTY_VALUES,
    email: user?.email ?? "",
    fullName: user?.name ?? "",
  };
}

interface IContactModalProps {
  open: boolean;
}

export default function ContactModal({ open }: IContactModalProps) {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const { user, isLoading: isUserLoading } = useUser();
  const createMessage = contactService.useCreateContactMessage();

  const form = useForm<ContactMessageRequest>({
    resolver: zodResolver(contactMessageRequestSchema),
    mode: "onChange",
    defaultValues: EMPTY_VALUES,
  });

  // Waits for the profile, because restoring first would dirty the form over empty defaults, and a late prefill must not overwrite an edit.
  const isReady = open && !isUserLoading;

  // Keyed on the strings because the session returns a new user object on every poll, and each reset would clear the shown errors.
  const profileEmail = user?.email;
  const profileName = user?.name;
  useEffect(() => {
    if (!isReady) return;

    form.reset(profileValues({ email: profileEmail, name: profileName }), {
      keepDirtyValues: true,
      keepDirty: true,
    });
  }, [isReady, profileEmail, profileName, form]);

  // Neither is user content, so keep them out of localStorage.
  const { restored, clearDraft } = useFormDraft({
    draftKey: DRAFT_KEY,
    form,
    enabled: isReady,
    exclude: ["sourcePath", "honeypot"],
  });

  async function handleSubmit(data: ContactMessageRequest) {
    if (data.honeypot) return;

    try {
      await createMessage.mutateAsync({ ...data, sourcePath: pathname });
      toast.success(
        data.email ? t("contact.modal.sentWithEmail") : t("contact.modal.sent"),
      );
      clearDraft();
      form.reset(EMPTY_VALUES);
      closeModalUrl();
    } catch (error) {
      applyProblemToForm(error, form, undefined, tAuth("errors.checkInput"));
    }
  }

  const sourceAvailable = t.rich("contact.modal.sourceAvailable", {
    link: (chunks) => (
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {chunks}
      </a>
    ),
  });

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("contact.modal.title")}
      description={t("contact.modal.description")}
      srOnlyDescription
      dirty={form.formState.isDirty}
      formId="contact-form"
      submitLabel={t("contact.modal.submit")}
      submitIcon={Send}
      submitLoading={createMessage.isPending}
      submitDisabled={!form.formState.isValid}
      cancelLabel={t("contact.modal.cancel")}
      resetLabel={t("contact.modal.reset")}
      resetDisabled={!form.formState.isDirty && !restored}
      onReset={() => {
        clearDraft();
        form.reset(profileValues(user));
      }}
    >
      <ContactChannels />

      <Form {...form}>
        <form
          id="contact-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mt-4 space-y-5"
        >
          {form.formState.errors.root && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {form.formState.errors.root.message}
            </div>
          )}

          <ContactFormFields />
        </form>
      </Form>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        {sourceAvailable}
      </p>
    </ModalShell>
  );
}
