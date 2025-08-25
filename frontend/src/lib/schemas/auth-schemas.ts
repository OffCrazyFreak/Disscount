import { z } from "zod";

export const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(2, { message: "Korisničko ime ili email mora imati najmanje 2 znaka" })
    .refine(
      (value) =>
        value.includes("@")
          ? z.email().safeParse(value).success
          : value.length >= 2 && value.length <= 40,
      "Nevažeće korisničko ime ili email"
    ),
  password: z
    .string()
    .min(12, { error: "Lozinka mora imati najmanje 12 znakova" })
    .max(40, { error: "Lozinka može imati najviše 40 znakova" })
    .refine((password) => /[A-Z]/.test(password), {
      error: "Lozinka mora sadržavati barem jedno veliko slovo",
    })
    .refine((password) => /[a-z]/.test(password), {
      error: "Lozinka mora sadržavati barem jedno malo slovo",
    })
    .refine((password) => /[0-9]/.test(password), {
      error: "Lozinka mora sadržavati barem jedan broj",
    })
    .refine((password) => /[!@#$%^&*]/.test(password), {
      error:
        "Lozinka mora sadržavati barem jedan specijalni znak (npr. !@#$%^&*)",
    }),
});

export const signUpSchema = z
  .object({
    email: z.email("Unesi važeći email"),

    password: z
      .string()
      .min(12, { error: "Lozinka mora imati najmanje 12 znakova" })
      .max(40, { error: "Lozinka može imati najviše 40 znakova" })
      .refine((password) => /[A-Z]/.test(password), {
        error: "Lozinka mora sadržavati barem jedno veliko slovo",
      })
      .refine((password) => /[a-z]/.test(password), {
        error: "Lozinka mora sadržavati barem jedno malo slovo",
      })
      .refine((password) => /[0-9]/.test(password), {
        error: "Lozinka mora sadržavati barem jedan broj",
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        error:
          "Lozinka mora sadržavati barem jedan specijalni znak (npr. !@#$%^&*)",
      }),

    confirmPassword: z
      .string()
      .min(12, { error: "Lozinka mora imati najmanje 12 znakova" })
      .max(40, { error: "Lozinka može imati najviše 40 znakova" })
      .refine((password) => /[A-Z]/.test(password), {
        error: "Lozinka mora sadržavati barem jedno veliko slovo",
      })
      .refine((password) => /[a-z]/.test(password), {
        error: "Lozinka mora sadržavati barem jedno malo slovo",
      })
      .refine((password) => /[0-9]/.test(password), {
        error: "Lozinka mora sadržavati barem jedan broj",
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        error:
          "Lozinka mora sadržavati barem jedan specijalni znak (npr. !@#$%^&*)",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

export type LoginFormType = z.infer<typeof loginSchema>;
export type SignUpFormType = z.infer<typeof signUpSchema>;
