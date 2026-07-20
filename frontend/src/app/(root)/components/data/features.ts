import type { LucideIcon } from "lucide-react";
import {
  Scale,
  ChartLine,
  ListChecks,
  Eye,
  ScanBarcode,
  WifiOff,
  BellRing,
  WalletCards,
  MapPin,
  PiggyBank,
  Share2,
} from "lucide-react";

export interface IFeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export const featureItems: IFeatureItem[] = [
  {
    title: "Usporedba cijena",
    description:
      "Isti proizvod, sve trgovine - odmah vidiš gdje je najjeftinije.",
    icon: Scale,
  },
  {
    title: "Povijest cijena",
    description:
      "Graf cijene kroz vrijeme otkriva je li akcija stvarno akcija.",
    icon: ChartLine,
  },
  {
    title: "Popisi za kupnju",
    description:
      "Složi popis i saznaj u kojoj trgovini je ukupna košarica najpovoljnija.",
    icon: ListChecks,
  },
  {
    title: "Praćenje proizvoda",
    description:
      "Dodaj proizvode koje kupuješ i drži njihove cijene na oku.",
    icon: Eye,
  },
  {
    title: "Skeniranje barkoda",
    description:
      "Uperi kameru u proizvod i cijene su pred tobom u sekundi.",
    icon: ScanBarcode,
  },
  {
    title: "Bez interneta",
    description:
      "Instaliraj kao aplikaciju - popisi i proizvodi dostupni i offline.",
    icon: WifiOff,
  },
  {
    title: "Pametne obavijesti",
    description:
      "Postavi željenu cijenu i javit ćemo ti kad proizvod pojeftini.",
    icon: BellRing,
    comingSoon: true,
  },
  {
    title: "Digitalne kartice",
    description:
      "Sve kartice trgovina u mobitelu - novčanik konačno na dijeti.",
    icon: WalletCards,
    comingSoon: true,
  },
  {
    title: "Karta trgovina",
    description:
      "Pronađi najbližu otvorenu trgovinu i njeno radno vrijeme.",
    icon: MapPin,
    comingSoon: true,
  },
  {
    title: "Dijeljenje popisa",
    description:
      "Podijeli popis s obitelji pa kupujte zajedno bez dupliciranja.",
    icon: Share2,
    comingSoon: true,
  },
  {
    title: "Analiza potrošnje",
    description:
      "Pregled koliko trošiš i koliko si uštedio iz mjeseca u mjesec.",
    icon: PiggyBank,
    comingSoon: true,
  },
];
