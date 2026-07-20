"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
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

export default function ContactModal({ open }: { open: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();
  const createMessage = contactService.useCreateContactMessage();

  const form = useForm<ContactMessageRequest>({
    resolver: zodResolver(contactMessageRequestSchema),
    mode: "onChange",
    defaultValues: EMPTY_VALUES,
  });

  // Prefill from the signed-in profile on open, unless the user is mid-edit.
  useEffect(() => {
    if (!open || form.formState.isDirty) return;
    form.reset({
      ...EMPTY_VALUES,
      email: user?.email ?? "",
      fullName: user?.name ?? "",
    });
  }, [open, user, form]);

  async function handleSubmit(data: ContactMessageRequest) {
    if (data.honeypot) return;

    try {
      await createMessage.mutateAsync({ ...data, sourcePath: pathname });
      toast.success(
        data.email
          ? "Poruka je poslana. Hvala na javljanju! Po potrebi ćemo ti se javiti na uneseni e-mail."
          : "Poruka je poslana. Hvala na javljanju!"
      );
      form.reset(EMPTY_VALUES);
      closeModalUrl();
    } catch (error) {
      applyProblemToForm(error, form.setError);
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Javi nam se"
      description="Javi nam se porukom kroz obrazac ispod ili nam se obrati direktno."
      srOnlyDescription
      dirty={form.formState.isDirty}
      formId="contact-form"
      submitLabel="Pošalji poruku"
      submitIcon={Send}
      submitLoading={createMessage.isPending}
      submitDisabled={!form.formState.isValid}
      cancelLabel="Odustani"
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
        Disscount je source-available.{" "}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Pogledajte projekt na GitHubu
        </a>
        .
      </p>
    </ModalShell>
  );
}
