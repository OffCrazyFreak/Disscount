import { localizedOgMetadata, renderLocalizedOg } from "@/lib/og/localized-og";

export const runtime = "nodejs";

interface ITwitterImageProps {
  params: Promise<{ locale: string }>;
}

export function generateImageMetadata({ params }: ITwitterImageProps) {
  return localizedOgMetadata(params);
}

export default function TwitterImage({ params }: ITwitterImageProps) {
  return renderLocalizedOg(params);
}
