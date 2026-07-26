interface IResponsiveLabelProps {
  /** Shown from `sm` up, where the full wording fits */
  full: string;
  /** Shown below `sm`, where the full wording would wrap or crowd the row */
  short: string;
}

/**
 * Swaps wording by breakpoint in CSS rather than through a media-query hook, so
 * the label ships in the prerendered HTML and never changes on hydration.
 *
 * Both strings are in the DOM, but the hidden one is `display: none`, which the
 * accessible name computation ignores, so the name already follows the visible
 * breakpoint. Do NOT add an `aria-label`: it would win over both and leave the
 * visible text outside the accessible name, which is a WCAG 2.5.3 failure.
 */
export default function ResponsiveLabel({
  full,
  short,
}: IResponsiveLabelProps) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  );
}
