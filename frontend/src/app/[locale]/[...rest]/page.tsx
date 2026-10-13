import { notFound } from "next/navigation";

// Unknown paths under a locale still need the localised 404 from [locale]/not-found.
export default function CatchAllPage() {
  notFound();
}
