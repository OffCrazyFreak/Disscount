import { plainText } from "@/lib/store-hours/sources/hours-text";

/**
 * "Label: hours" pairs from an HTML fragment whose lines are split by
 * `<br>` or block tags, as most chains print a week ("Ponedjeljak:
 * 07:00-21:00<br><strong>Nedjelja:</strong> Zatvoreno", "PONEDJELJAK
 * 07:00 - 20:00"). A line counts only when its value starts with a time or
 * a closed word, so "Adresa: …" and "Telefon: …" are skipped.
 */
export function labelledLines(html: string): [string, string][] {
  return html
    .split(/<br\s*\/?>|<\/p>|<\/div>|\r?\n|\|/i)
    .map(plainText)
    .flatMap((line): [string, string][] => {
      const match =
        /^([\p{L}. \-–]+?)\s*(?::\s*|\s+)(\d.*|zatvoreno|ne ?radi\w*|neradn\w*)$/iu.exec(
          line,
        );

      return match ? [[match[1], match[2]]] : [];
    });
}
