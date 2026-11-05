interface IResponsiveLabelProps {
  /** Shown from `sm` up, where the full wording fits */
  full: string;
  /** Shown below `sm`, where the full wording would wrap or crowd the row */
  short: string;
}

/** CSS swap so the label prerenders; an `aria-label` would drop the visible text from the name (WCAG 2.5.3). */
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
