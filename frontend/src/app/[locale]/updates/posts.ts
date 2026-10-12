export type Post = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  author: string;
};

// Template posts so the layout can be filled with real announcements later.
export const templatePosts: Post[] = [
  {
    id: "disscount-launch",
    title: "Disscount kreće! Hvala našim beta testerima",
    excerpt:
      "Pozivamo prvih dvjestotinjak korisnika s liste čekanja da prvi isprobaju Disscount.",
    content:
      "Veliki dan je stigao - Disscount službeno kreće! Najprije pozivamo prvih dvjestotinjak korisnika s naše liste čekanja da prvi isprobaju aplikaciju i pomognu nam je učiniti još boljom.\n\nHvala ti na strpljenju i vjernosti. Tvoje povjerenje i podrška od prvog dana znače nam jako puno. Ovo je tek početak, a najbolje tek dolazi - radujemo se što ovaj put krećemo zajedno s tobom.",
    imageUrl: "/placeholder-image.svg",
    date: "2026-06-21",
    author: "Disscount tim",
  },
  {
    id: "whats-next",
    title: "Što slijedi nakon lansiranja",
    excerpt:
      "Pripremamo nove značajke - od karte trgovina do praćenja potrošnje. Tvoji prijedlozi oblikuju što gradimo sljedeće.",
    content:
      "U sljedećim tjednima radimo na nizu novih značajki: interaktivnoj karti trgovina s radnim vremenom, pregledu vlastite potrošnje te digitalnim karticama vjernosti.\n\nTvoje mišljenje nam je najvažnije - na stranici Ideje i prijedlozi možeš predložiti nove značajke i glasati za one koje želiš vidjeti prve.",
    imageUrl: "/placeholder-image.svg",
    date: "2026-06-21",
    author: "Disscount tim",
  },
];

export function getPostById(id: string): Post | undefined {
  return templatePosts.find((post) => post.id === id);
}
