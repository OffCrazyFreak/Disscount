import { parseProblem } from "@/lib/api/problem-details";

/**
 * Only a 404 means the list was deleted or stopped being shared. Anything else is worth a
 * retry, and a list already on screen stays there through it, since a shared list polls and
 * one dropped request on shop wifi would otherwise swap the list being ticked for an error.
 */
export function isDeadListLink(error: Error | null) {
  return parseProblem(error)?.status === 404;
}
