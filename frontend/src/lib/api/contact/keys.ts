export const CONTACT_QUERY_KEYS = {
  all: ["admin", "contact"] as const,
  list: (includeDeleted: boolean) =>
    ["admin", "contact", { includeDeleted }] as const,
};
