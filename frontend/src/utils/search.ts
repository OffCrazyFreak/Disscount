/**
 * Whether submitting would change anything. It can only ever answer for the
 * query, never for the filters, since a filter applies itself as you pick it.
 */
export function canSubmitSearch(query: string, routeQuery: string): boolean {
  const trimmed = query.trim();

  // An empty field counts as unchanged whatever the URL holds: comparing it
  // flashes the button on for one render between the clear emptying the field
  // and the navigation landing.
  if (!trimmed) return false;

  return trimmed !== routeQuery.trim();
}
