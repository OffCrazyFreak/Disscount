import renderBrandOg, { alt, contentType, size } from "@/app/og/render-og";

export const runtime = "nodejs";
export { alt, contentType, size };

export default async function OpengraphImage() {
  return renderBrandOg();
}
