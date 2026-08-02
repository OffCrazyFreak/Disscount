import { CijeneApiError } from "@/lib/cijene-api/errors";
import { parseProblem } from "@/lib/api/problem-details";

// The upstream price API speaks English and leaks implementation detail, so its
// statuses are mapped rather than shown. Anything unmapped falls back to the
// caller's own copy.
const CIJENE_STATUS_MESSAGES: Record<number, string> = {
  0: "Nema veze s internetom. Provjeri vezu i pokušaj ponovno.",
  404: "Podaci nisu pronađeni.",
  429: "Previše zahtjeva odjednom. Pričekaj trenutak i pokušaj ponovno.",
  500: "Izvor podataka trenutačno ne radi. Pokušaj kasnije.",
  502: "Izvor podataka trenutačno nije dostupan. Pokušaj kasnije.",
  503: "Izvor podataka trenutačno nije dostupan. Pokušaj kasnije.",
  504: "Izvoru podataka je isteklo vrijeme. Pokušaj kasnije.",
};

/**
 * The one place an error becomes something a person reads.
 *
 * Two error shapes reach the UI: RFC 9457 Problem Details from our backend, and
 * CijeneApiError from the upstream price API. Callers should not have to know
 * which one they got, so both collapse here and everything else takes `fallback`.
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof CijeneApiError) {
    return CIJENE_STATUS_MESSAGES[error.status] ?? fallback;
  }

  const problem = parseProblem(error);

  // `title` is often the bare status phrase ("Bad Request"), so it is a last
  // resort behind `detail`, which the backend writes for humans.
  return problem?.detail || problem?.title || fallback;
}
