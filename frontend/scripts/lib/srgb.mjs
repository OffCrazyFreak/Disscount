// Tag rasters sRGB so wide-gamut viewers colour-manage them like the SVG. An
// untagged PNG is treated as device-native and over-saturates the green, so
// every generator finishes its pipeline with this profile.
import sharp from "sharp";

export const SRGB = "srgb";

// Pass a background to drop the alpha channel, for the outputs whose platform
// wants an opaque image.
export async function writeSrgbPng(file, buffer, background) {
  const png = sharp(buffer).withIccProfile(SRGB);

  await (background ? png.flatten({ background }) : png).png().toFile(file);
}
