/** The version segment retires cached data of an old shape, which a new reader would crash on; bump it when the card DTO changes shape. */
export const DIGITAL_CARD_KEY_VERSION = "v2";

export const DIGITAL_CARD_QUERY_KEYS = {
  all: ["digitalCards"] as const,
  me: ["digitalCards", DIGITAL_CARD_KEY_VERSION, "me"] as const,
  config: ["digitalCards", DIGITAL_CARD_KEY_VERSION, "config"] as const,
};
