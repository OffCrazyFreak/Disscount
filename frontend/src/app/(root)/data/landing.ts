export const tagLines: string[] = [
  "Usporedi trgovine i cijene!",
  "Uštedi pri svakoj kupnji!",
  "Nikad ne propusti akciju!",
  "Zaboravi kartice - olakšaj novčanik!",
  "Izradi i podijeli popis za kupnju!",
  "Prati povijest cijena!",
  "Skeniraj barkod i usporedi cijene!",
  "Uživaj u pametnom kupovanju!",
  "Pronađi najbolje ponude u Hrvatskoj!",
  "Kupuj kvalitetno i jeftino!",
  "Kupuj pametno, uštedi više!",
  "Tvoj partner u pametnoj kupovini!",
  "Zaboravi na kataloge i letke!",
];

export interface IHowItWorksStep {
  title: string;
  description: string;
}

export const howItWorksSteps: IHowItWorksStep[] = [
  {
    title: "Pretraži ili skeniraj",
    description: "Upiši naziv proizvoda ili skeniraj barkod kamerom.",
  },
  {
    title: "Usporedi cijene",
    description:
      "Vidiš cijenu u svim trgovinama i povijest cijene kroz vrijeme.",
  },
  {
    title: "Uštedi pri kupnji",
    description:
      "Odaberi najpovoljniju trgovinu i kupuj bez listanja kataloga.",
  },
];

export interface IStatItem {
  value: string;
  label: string;
}

export const statItems: IStatItem[] = [
  { value: "29", label: "trgovačkih lanaca" },
  { value: "100 %", label: "besplatno, zauvijek" },
  { value: "0", label: "kataloga za listanje" },
];

export interface IPricingRow {
  label: string;
  comingSoon?: boolean;
}

export const freePlanRows: IPricingRow[] = [
  { label: "Usporedba cijena i povijest cijena" },
  { label: "Neograničeni popisi za kupnju" },
  { label: "Praćenje proizvoda" },
  { label: "Skeniranje barkoda" },
  { label: "Instalacija kao aplikacija (PWA)" },
];

export const proPlanRows: IPricingRow[] = [
  { label: "Obavijesti o padu cijena", comingSoon: true },
  { label: "Napredna analiza potrošnje", comingSoon: true },
  { label: "AI prijedlozi za jeftiniju košaricu", comingSoon: true },
];
