// A one-word store gets its first two letters, so "Konzum" and "Kaufland" stay apart.
export function initialsOf(storeName: string): string {
  const words = storeName.split(/\s+/).filter(Boolean);
  const letters =
    words.length === 1
      ? Array.from(words[0]).slice(0, 2)
      : words.slice(0, 2).map((word) => Array.from(word)[0]);

  return letters.join("").toUpperCase();
}
