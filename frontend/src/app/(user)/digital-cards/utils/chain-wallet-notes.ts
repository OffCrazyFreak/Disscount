export interface IChainWalletNote {
  text: string;
  href?: string;
  linkLabel?: string;
}

const NOTES: Record<string, IChainWalletNote> = {
  lidl: {
    text: "Kuponi i plaćanje rade samo u aplikaciji Lidl Plus. Na blagajni provjeri je li kartica očitana na računu.",
    href: "https://www.lidl.hr/c/lidl-plus-kako-koristiti-lidl-plus/s10027648",
    linkLabel: "O Lidl Plus",
  },
  kaufland: {
    text: "Kupone aktiviraš u aplikaciji Kaufland. Na blagajni provjeri je li kartica očitana na računu.",
    href: "https://www.kaufland.hr/kauflandcard.html",
    linkLabel: "O Kaufland Card",
  },
  dm: {
    text: "Za kupone koristi aplikaciju Moj dm. Na blagajni provjeri je li kartica očitana na računu.",
    href: "https://www.dm.hr/services/programi-za-kupce/moj-dm-aplikacija",
    linkLabel: "O aplikaciji Moj dm",
  },
  konzum: {
    text: "Pravila MultiPlus kartice zabranjuju kopiranje kartice. Spremljeni broj koristi samo za svoju karticu.",
    href: "https://www.multipluscard.hr/o-nama/pravila-nagradjivanja",
    linkLabel: "Pravila MultiPlus kartice",
  },
};

export function getChainWalletNote(
  chainCode: string | null,
): IChainWalletNote | null {
  return (chainCode && NOTES[chainCode]) || null;
}
