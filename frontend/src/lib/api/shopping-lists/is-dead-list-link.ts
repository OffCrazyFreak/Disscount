import { parseProblem } from "@/lib/api/problem-details";

/** Only a 404 means gone, so one dropped request on shop wifi cannot replace the list with an error. */
export function isDeadListLink(error: Error | null) {
  return parseProblem(error)?.status === 404;
}
