export interface IShoppingListItemUpdate {
  isChecked: boolean;
  amount: number;
  chainCode: string | null;
  /** Only a plain item is renamed, and only by someone who may edit items. */
  name?: string;
  /** Typed by hand for a plain item; a catalogue item's price is captured on ticking. */
  storePrice?: number | null;
}
