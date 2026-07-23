export interface IFaqItem {
  question: string;
  answer: string;
}

export const faqItems: IFaqItem[] = [
  {
    question: "Odakle Disscountu cijene proizvoda?",
    answer:
      "Od 15. svibnja 2025. trgovački lanci u Hrvatskoj zakonski su obvezni javno objavljivati cijene. Disscount ih preuzima kroz otvoreni projekt Cijene API, koji svakodnevno prikuplja službene cjenike trgovina.",
  },
  {
    question: "Je li Disscount stvarno besplatan?",
    answer:
      "Da. Pretraga proizvoda, usporedba cijena, povijest cijena i popisi za kupnju besplatni su i takvi ostaju.",
  },
  {
    question: "Koje trgovine mogu usporediti?",
    answer:
      "Disscount pokriva 25+ trgovačkih lanaca diljem Hrvatske - među njima Konzum, Lidl, Plodine, Spar, Kaufland, Tommy, Studenac, Eurospin i dm.",
  },
  {
    question: "Trebam li napraviti račun?",
    answer:
      "Ne za pretragu i usporedbu cijena - to radi odmah. Račun ti treba tek kad želiš spremati popise za kupnju i pratiti proizvode.",
  },
  {
    question: "Kako skeniram barkod proizvoda?",
    answer:
      "Klikni Skeniraj barkod, dopusti pristup kameri i uperi je u barkod na proizvodu - Disscount odmah otvara taj proizvod s cijenama u svim trgovinama.",
  },
  {
    question: "Radi li aplikacija bez interneta?",
    answer:
      "Da. Disscount možeš instalirati kao aplikaciju na mobitel ili računalo, a spremljeni popisi i pregledani proizvodi dostupni su i offline. Promjene se automatski sinkroniziraju kad se vratiš na mrežu.",
  },
];
