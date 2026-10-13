import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginRequestSchema, LoginRequest } from "@/lib/api/schemas/auth-user";
import { signIn } from "@/lib/auth/client";
import { useUser } from "@/context/user-context";
import { setLastLoginMethod } from "@/utils/browser/local-storage";
import { PASSWORD_BREACHED } from "@/lib/auth/password-policy";

export function useLoginForm(onSuccess?: () => void) {
  const { handleUserLogin } = useUser();
  // Set when a correct password is refused as breached; swaps the form for a notice.
  const [breachedEmail, setBreachedEmail] = useState<string | null>(null);
  const refocusPassword = useRef(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginRequest) {
    form.clearErrors("root");

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        // Before the status mapping: this refusal is also a 403.
        if (result.error.code === PASSWORD_BREACHED) {
          setBreachedEmail(data.email);
          form.resetField("password");
          return;
        }

        const status = result.error.status ?? 0;
        let message: string;
        if (status === 403) {
          // Email not verified - Better Auth re-sends the verification link on each attempt.
          message =
            "Tvoj email još nije potvrđen. Poslali smo ti novu poveznicu - provjeri inbox (i spam).";
        } else if (status === 401 || status === 400) {
          message = "Neispravni email ili lozinka";
        } else {
          message = result.error.message || "Provjeri unesene podatke.";
        }
        form.setError("root", { type: "server", message });
        return;
      }

      await handleUserLogin();
      toast.success("Prijava uspješna!");
      form.reset();
      setLastLoginMethod("email");
      onSuccess?.();
    } catch {
      toast.error("Greška pri prijavi. Pokušaj ponovo.");
    }
  }

  // The notice unmounts on "back", so focus would otherwise fall to the body.
  useEffect(() => {
    if (breachedEmail || !refocusPassword.current) return;

    refocusPassword.current = false;
    form.setFocus("password");
  }, [breachedEmail, form]);

  function clearBreached() {
    refocusPassword.current = true;
    setBreachedEmail(null);
  }

  return { form, onSubmit, breachedEmail, clearBreached };
}
