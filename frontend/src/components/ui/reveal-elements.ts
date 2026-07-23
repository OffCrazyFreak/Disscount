export type RevealContainerTag = "div" | "ul" | "ol" | "section";
export type RevealItemTag = "div" | "li";

export function itemTagFor(
  container: RevealContainerTag,
  itemAs?: RevealItemTag,
): RevealItemTag {
  if (itemAs) return itemAs;

  return container === "ul" || container === "ol" ? "li" : "div";
}
