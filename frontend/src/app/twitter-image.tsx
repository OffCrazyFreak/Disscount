import renderBrandOg, { alt, contentType, size } from "./og/render-og";

export const runtime = "nodejs";
export { alt, contentType, size };

export default async function TwitterImage() {
  return renderBrandOg();
}
