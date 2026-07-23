export interface IUsePriceHistoryArgs {
  ean: string;
  /** Number of days back INCLUDING today. Pass -1 for all available history, capped to not go earlier than 2025-05-16. */
  days?: number;
}
