export type SuggestionComment = {
  id: string;
  author: string;
  content: string;
  date: string;
};

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  author: string;
  date: string;
  comments: SuggestionComment[];
};

// Template suggestions so the layout and detail page can be filled with real data later.
export const templateSuggestions: Suggestion[] = [
  {
    id: "price-history",
    title: "Usporedba cijena kroz vrijeme",
    description:
      "Graf koji prikazuje kako se cijena proizvoda mijenjala kroz mjesece kako bismo znali je li akcija stvarno povoljna.",
    upvotes: 42,
    author: "Ivana",
    date: "2026-06-10",
    comments: [
      {
        id: "c1",
        author: "Marko",
        content: "Ovo bi mi puno pomoglo prije većih kupnji.",
        date: "2026-06-11",
      },
      {
        id: "c2",
        author: "Disscount tim",
        content: "Odlična ideja, već je na našoj listi za razmatranje.",
        date: "2026-06-12",
      },
    ],
  },
  {
    id: "shared-lists",
    title: "Dijeljenje popisa za kupnju s obitelji",
    description:
      "Mogućnost da više članova obitelji uređuje isti popis za kupnju u stvarnom vremenu.",
    upvotes: 37,
    author: "Petra",
    date: "2026-06-08",
    comments: [
      {
        id: "c1",
        author: "Ana",
        content: "Da, da, da! Stalno šaljemo popise preko poruka.",
        date: "2026-06-09",
      },
    ],
  },
  {
    id: "store-deal-alerts",
    title: "Obavijesti o akcijama omiljenih trgovina",
    description:
      "Push obavijest kada moja omiljena trgovina objavi novi katalog ili akciju na proizvode koje pratim.",
    upvotes: 28,
    author: "Luka",
    date: "2026-06-05",
    comments: [
      {
        id: "c1",
        author: "Iva",
        content: "Bilo bi super da se može filtrirati po kategorijama.",
        date: "2026-06-06",
      },
      {
        id: "c2",
        author: "Tomislav",
        content: "Samo neka ne bude previše obavijesti.",
        date: "2026-06-07",
      },
    ],
  },
  {
    id: "receipt-scanning",
    title: "Skeniranje računa za praćenje potrošnje",
    description:
      "Skeniranje računa nakon kupnje kako bi aplikacija automatski pratila koliko trošimo i gdje.",
    upvotes: 19,
    author: "Maja",
    date: "2026-06-02",
    comments: [],
  },
];

export function getSuggestionById(id: string): Suggestion | undefined {
  return templateSuggestions.find((suggestion) => suggestion.id === id);
}
