interface IPendingStatusProps {
  pending: boolean;
  label: string;
}

/**
 * Announces what a pending action is doing, for cases where the only visual cue
 * is a spinner inside a button that `disabled` has just dropped from the
 * accessibility tree.
 *
 * The region stays mounted and only its text toggles. Inserting a live region
 * together with its text usually lands before the screen reader is watching it,
 * and the announcement is silently lost.
 */
export default function PendingStatus({ pending, label }: IPendingStatusProps) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {pending ? label : ""}
    </span>
  );
}
