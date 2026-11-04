import { parseProblem } from "@/lib/api/problem-details";

/** Only a 404 means deleted or unshared, because one dropped request on shop wifi must not swap the list being ticked for an error. */
export function isDeadListLink(error: Error | null) {
  return parseProblem(error)?.status === 404;
}
