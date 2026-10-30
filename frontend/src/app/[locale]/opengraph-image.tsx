import { localizedOgMetadata, renderLocalizedOg } from "@/app/og/localized-og";

export const runtime = "nodejs";

interface IOpengraphImageProps {
  params: Promise<{ locale: string }>;
}

export function generateImageMetadata({ params }: IOpengraphImageProps) {
  return localizedOgMetadata(params);
}

export default function OpengraphImage({ params }: IOpengraphImageProps) {
  return renderLocalizedOg(params);
}
