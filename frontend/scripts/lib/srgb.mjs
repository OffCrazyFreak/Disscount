// Tag rasters sRGB so wide-gamut viewers colour-manage them like the SVG. An
// untagged PNG is treated as device-native and over-saturates the green, so
// every generator finishes its pipeline with this profile.
import sharp from "sharp";

export const SRGB = "srgb";

export async function writeSrgbPng(file, buffer) {
  await sharp(buffer).withIccProfile(SRGB).png().toFile(file);
}
