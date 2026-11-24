// Generated stand-ins for the photos a real user would upload: an avatar and the
// front and back of a loyalty card. Drawn from SVG so the repository ships no binaries.
import sharp from "sharp";

const CARD_WIDTH = 856;
const CARD_HEIGHT = 540;
const THUMB_WIDTH = 320;

function escapeXml(text) {
  return text.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A 256px WebP data URI, the shape the settings avatar cropper sends. */
export async function avatarDataUri(initials, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" fill="${color}"/>
    <text x="128" y="160" font-family="sans-serif" font-size="104" font-weight="700"
      fill="#fff" text-anchor="middle">${escapeXml(initials)}</text></svg>`;
  const webp = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
  return `data:image/webp;base64,${webp.toString("base64")}`;
}

function cardSvg(card, side) {
  const stripes = Array.from({ length: 48 }, (_, i) => {
    const width = 2 + ((i * 7) % 5);
    return `<rect x="${120 + i * 13}" y="300" width="${width}" height="120" fill="#111"/>`;
  }).join("");
  const body =
    side === "front"
      ? `<text x="60" y="140" font-size="72" font-weight="700" fill="#fff">${escapeXml(card.storeName)}</text>
         <text x="60" y="220" font-size="40" fill="#fff">${escapeXml(card.cardName)}</text>
         <text x="60" y="470" font-size="34" fill="#fff" font-family="monospace">${escapeXml(card.codeValue)}</text>`
      : `<rect x="80" y="280" width="696" height="200" rx="12" fill="#fff"/>${stripes}
         <text x="60" y="120" font-size="30" fill="#fff">Uzorak kartice, nije prava kartica</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}"
    font-family="sans-serif"><rect width="100%" height="100%" rx="36" fill="${card.cardColor}"/>${body}</svg>`;
}

/** JPEG full image and thumbnail for one side, as the card photo upload expects. */
export async function cardPhoto(card, side) {
  const image = sharp(Buffer.from(cardSvg(card, side)));
  const full = await image.clone().jpeg({ quality: 82 }).toBuffer();
  const thumb = await image
    .clone()
    .resize({ width: THUMB_WIDTH })
    .jpeg({ quality: 75 })
    .toBuffer();
  return { full, thumb };
}
