import type { LucideIcon } from "lucide-react";
import {
  Scale,
  ChartLine,
  ListChecks,
  Eye,
  ScanBarcode,
  WifiOff,
  BellRing,
  CreditCard,
  Map as MapIcon,
  PiggyBank,
  Share2,
} from "lucide-react";

export interface IFeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  /** Link target; leave commented on coming-soon items until their page ships */
  href?: string;
  /** Client action instead of a link */
  action?: "scanner" | "notifications";
}

export const featureItems: IFeatureItem[] = [
  {
    title: "Skeniranje barkoda",
    description: "Uperi kameru u proizvod i cijene su pred tobom u sekundi.",
    icon: ScanBarcode,
    action: "scanner",
  },
  {
    title: "Usporedba cijena",
    description:
      "Isti proizvod, sve trgovine - odmah vidiš gdje je najjeftinije.",
    icon: Scale,
    href: "/products",
  },
  {
    title: "Povijest cijena",
    description:
      "Graf cijene kroz vrijeme otkriva je li akcija stvarno akcija.",
    icon: ChartLine,
    href: "/products",
  },
  {
    title: "Popisi za kupnju",
    description:
      "Složi popis i saznaj u kojoj trgovini je ukupna košarica najpovoljnija.",
    icon: ListChecks,
    href: "/shopping-lists",
  },
  {
    title: "Dijeljenje popisa",
    description: "Podijeli popis s obitelji pa kupuj zajedno bez dupliciranja.",
    icon: Share2,
    comingSoon: true,
    // href: "/shopping-lists",
  },
  {
    title: "Analiza potrošnje",
    description: "Pregled koliko trošiš i koliko štediš iz mjeseca u mjesec.",
    icon: PiggyBank,
    comingSoon: true,
    // href: "/spending",
  },
  {
    title: "Praćenje proizvoda",
    description: "Dodaj proizvode koje kupuješ i drži njihove cijene na oku.",
    icon: Eye,
    href: "/watchlist",
  },
  {
    title: "Pametne obavijesti",
    description:
      "Postavi željenu cijenu i javit ćemo ti kad proizvod pojeftini.",
    icon: BellRing,
    action: "notifications",
  },
  {
    title: "Digitalne kartice",
    description:
      "Sve kartice trgovina u mobitelu - novčanik konačno na dijeti.",
    icon: CreditCard,
    comingSoon: true,
    // href: "/digital-cards",
  },
  {
    title: "Bez interneta",
    description:
      "Instaliraj kao aplikaciju - popisi i proizvodi dostupni i offline.",
    icon: WifiOff,
  },
  {
    title: "Karta trgovina",
    description: "Pronađi najbližu otvorenu trgovinu i njeno radno vrijeme.",
    icon: MapIcon,
    comingSoon: true,
    // href: "/map",
  },
];
