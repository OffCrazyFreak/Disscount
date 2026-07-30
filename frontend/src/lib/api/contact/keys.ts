/** Nests under the `admin` root, so an admin-wide purge takes contact with it. */
export const CONTACT_QUERY_KEYS = {
  all: ["admin", "contact"] as const,
  list: (includeDeleted: boolean) =>
    ["admin", "contact", { includeDeleted }] as const,
  detail: (id: string) => ["admin", "contact", "detail", id] as const,
};
