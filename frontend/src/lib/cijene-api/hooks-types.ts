export interface IUsePriceHistoryArgs {
  ean: string;
  /** Number of days back INCLUDING today. Pass -1 for all available history, capped to not go earlier than 2025-05-16. */
  days?: number;
  /**
   * False until the rest of the page has settled. One request per day goes out here, so
   * left ungated the window competes with the page it sits under. Latched once true.
   */
  enabled?: boolean;
}
