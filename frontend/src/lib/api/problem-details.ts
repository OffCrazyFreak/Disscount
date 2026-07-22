import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { z } from "zod";

// RFC 9457 Problem Details as emitted by the backend GlobalExceptionHandler.
export const problemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export function parseProblem(error: unknown): ProblemDetails | null {
  if (!isAxiosError(error) || !error.response?.data) return null;

  const parsed = problemDetailsSchema.safeParse(error.response.data);
  return parsed.success ? parsed.data : null;
}

export function problemMessage(error: unknown, fallback: string): string {
  const problem = parseProblem(error);
  return problem?.detail || problem?.title || fallback;
}

/**
 * Maps a Problem Details error onto react-hook-form: a fieldError lands on its field
 * only when that field is registered (or renamed via fieldMap); anything unknown, and
 * the case of no field match at all, becomes a root error so it stays visible. Returns
 * true when at least one field-level error was applied.
 */
export function applyProblemToForm<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  fieldMap?: Partial<Record<string, Path<T>>>,
  fallbackMessage = "Provjeri unesene podatke.",
): boolean {
  const problem = parseProblem(error);
  const knownFields = new Set(Object.keys(form.getValues()));
  let matchedField = false;

  for (const [field, message] of Object.entries(problem?.fieldErrors ?? {})) {
    const mapped = fieldMap?.[field];
    if (!mapped && !knownFields.has(field)) continue;
    form.setError(mapped ?? (field as Path<T>), { type: "server", message });
    matchedField = true;
  }

  if (!matchedField) {
    form.setError("root", {
      type: "server",
      message: problem?.detail || problem?.title || fallbackMessage,
    });
  }

  return matchedField;
}
