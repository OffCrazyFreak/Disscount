/**
 * The names of a product's two stateful actions, in one place.
 *
 * A card's button row and its hold sheet are one control in two shapes, so they have to
 * say the same thing. They drifted: the sheet offered "Dodaj na popis" while the row
 * offered "Dodaj na popis za kupnju", which costs a voice-control user the phrase they
 * learned and reads to a screen reader as two different controls for one action.
 */
export const PRODUCT_ACTION_LABELS = {
  addToList: "Dodaj na popis za kupnju",
  editListEntry: "Uredi unos na popisu za kupnju",
  watch: "Prati proizvod",
  editWatch: "Ažuriraj praćenje",
} as const;
