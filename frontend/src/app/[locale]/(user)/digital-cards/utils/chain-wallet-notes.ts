// The wording lives in the digitalCards catalog under chainNotes.<code>.
const NOTE_LINKS = {
  lidl: "https://www.lidl.hr/c/lidl-plus-kako-koristiti-lidl-plus/s10027648",
  kaufland: "https://www.kaufland.hr/kauflandcard.html",
  dm: "https://www.dm.hr/services/programi-za-kupce/moj-dm-aplikacija",
  konzum: "https://www.multipluscard.hr/o-nama/pravila-nagradjivanja",
} as const;

export type ChainNoteCode = keyof typeof NOTE_LINKS;

export interface IChainWalletNote {
  code: ChainNoteCode;
  href: string;
}

function hasNote(chainCode: string): chainCode is ChainNoteCode {
  return Object.hasOwn(NOTE_LINKS, chainCode);
}

export function getChainWalletNote(
  chainCode: string | null,
): IChainWalletNote | null {
  if (!chainCode || !hasNote(chainCode)) return null;

  return { code: chainCode, href: NOTE_LINKS[chainCode] };
}
