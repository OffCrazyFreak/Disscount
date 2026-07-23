import SparkleDoodle from "@/app/(root)/components/doodles/sparkle-doodle";
import { cn } from "@/lib/utils";

interface ISparkleFieldProps {
  count: number;
  seed: string;
  className?: string;
  palette?: string[];
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(state: number) {
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const defaultPalette = [
  "text-primary/70",
  "text-secondary/60",
  "text-primary/40",
];

// A seeded PRNG keeps positions identical across SSR; horizontal placement is
// stratified into one band per index so small counts spread out instead of clustering.
export default function SparkleField({
  count,
  seed,
  className,
  palette = defaultPalette,
}: ISparkleFieldProps) {
  if (count <= 0) return null;

  const random = mulberry32(hashSeed(seed));

  const sparkles = Array.from({ length: count }, (_, index) => ({
    id: index,
    top: 4 + random() * 88,
    left: 3 + ((index + 0.15 + random() * 0.7) / count) * 92,
    size: 12 + random() * 18,
    tilt: (random() - 0.5) * 60,
    delay: random() * 2.4,
    duration: 1.8 + random() * 1.8,
    color: palette[Math.floor(random() * palette.length)],
  }));

  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="absolute"
          style={{
            top: `${sparkle.top}%`,
            left: `${sparkle.left}%`,
            width: sparkle.size,
            transform: `rotate(${sparkle.tilt}deg)`,
          }}
        >
          <SparkleDoodle
            className={cn("w-full", sparkle.color)}
            delay={sparkle.delay}
            duration={sparkle.duration}
          />
        </span>
      ))}
    </div>
  );
}
