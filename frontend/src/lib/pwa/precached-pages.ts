export const OFFLINE_PAGE_PATH = "/offline";

// A cashier asks for a card with no signal, so the wallet opens however long since its last visit.
export const WALLET_PAGE_PATH = "/digital-cards";

/** No account data, since one copy serves everyone; the wallet reads cards from IndexedDB later. */
export const PRECACHED_PAGE_PATHS = [OFFLINE_PAGE_PATH, WALLET_PAGE_PATH];
