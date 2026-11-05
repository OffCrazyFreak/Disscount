export interface IUsePriceHistoryArgs {
  ean: string;
  /** Days back including today; -1 means all history, capped at 2025-05-16. */
  days?: number;
}
