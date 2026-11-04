export const OFFLINE_PAGE_PATH = "/offline";

// A cashier asks for a card in a shop with no signal, so the wallet must open offline however long since its last visit.
export const WALLET_PAGE_PATH = "/digital-cards";

/** They must render no account data, since one copy serves everyone on the device; the wallet reads cards from IndexedDB after hydration. */
export const PRECACHED_PAGE_PATHS = [OFFLINE_PAGE_PATH, WALLET_PAGE_PATH];
