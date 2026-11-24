export interface IDguTarget {
  id: string;
  address: string;
  city: string | null;
}

export interface IDguCandidate {
  target: number;
  northing: number;
  easting: number;
  /** Postal descriptor and admin unit ids, resolved to names after the zip. */
  refs: number[];
  /** The street matched without leaning on the five-letter stem alone. */
  exact: boolean;
}
