/** Sized against the widest label in its bold weight, which it has to enclose. */
const DISC_CLASS = "size-[57.6px] rounded-full bg-primary/15";

interface IBottomNavActiveDiscProps {
  index: number;
  count: number;
  /** Zero on the centre cell, whose raised circle already marks it */
  opacity: number;
}

/**
 * One element that never unmounts, so both its slide and its fade are ordinary
 * CSS transitions and no previous value has to be held anywhere.
 */
export default function BottomNavActiveDisc({
  index,
  count,
  opacity,
}: IBottomNavActiveDiscProps) {
  return (
    <li
      aria-hidden
      className="pointer-events-none absolute inset-y-0 flex items-center justify-center transition-[left,opacity] duration-200 ease-out motion-reduce:transition-none"
      style={{
        left: `${(index * 100) / count}%`,
        width: `${100 / count}%`,
        opacity,
      }}
    >
      <span className={DISC_CLASS} />
    </li>
  );
}
