/**
 * Location/City data for sidebar
 */

export interface IStoreLocation {
  name: string;
  storeCount: number;
  chains: string[];
  /** Raw upstream city values grouped under this display name */
  sourceCities: string[];
}
