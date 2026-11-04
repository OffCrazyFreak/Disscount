import { NextResponse } from "next/server";
import { BRAND_OG_IMAGE_ID } from "@/app/og/localized-og";
import {
  productShareImageFile,
  productShareImagePath,
} from "@/app/og/product-share-image";
import renderProductOg from "@/app/og/render-product-og";
import { getVerifiedMainPhotoUrl } from "@/lib/api/product-images/server";
import { appUrl } from "@/lib/env";
import { isWellFormedProductId } from "@/utils/product-id";

export const runtime = "nodejs";

// Temporary and uncached, because the outcome changes once the photo appears or the outage ends.
function redirectTo(path: string) {
  return NextResponse.redirect(`${appUrl()}${path}`, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  { params }: RouteContext<"/og/products/[ean]/[file]">,
) {
  const { ean, file } = await params;
  if (!isWellFormedProductId(ean)) {
    return new NextResponse(null, { status: 404 });
  }

  const brandImagePath = `/opengraph-image/${BRAND_OG_IMAGE_ID}`;
  const photoUrl = await getVerifiedMainPhotoUrl(ean);
  if (!photoUrl) return redirectTo(brandImagePath);

  // Only the exact advertised URL renders, because a made-up name or query string is a new CDN key that would force a render per request.
  const isCurrentUrl =
    file === productShareImageFile(photoUrl) && !new URL(request.url).search;
  if (!isCurrentUrl) {
    return redirectTo(productShareImagePath(ean, photoUrl));
  }

  try {
    return await renderProductOg(photoUrl);
  } catch (error) {
    console.error("Product share image failed", error);
    return redirectTo(brandImagePath);
  }
}
