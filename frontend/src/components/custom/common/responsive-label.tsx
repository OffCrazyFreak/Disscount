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
 * Both strings are in the DOM, so the control must carry the full wording in its
 * own `aria-label`, which then wins over either of them as the accessible name.
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
