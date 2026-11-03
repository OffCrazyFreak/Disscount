export const OFFLINE_PAGE_PATH = "/offline";

// A cashier asks for a card in a shop with no signal, so the wallet has to open
// offline however long ago it was last visited, not only while a runtime cache lasts.
export const WALLET_PAGE_PATH = "/digital-cards";

/**
 * Pages precached in every language by each build. They must render no account data,
 * since one copy serves everyone on the device: the wallet reads its cards from
 * IndexedDB after hydration.
 */
export const PRECACHED_PAGE_PATHS = [OFFLINE_PAGE_PATH, WALLET_PAGE_PATH];
