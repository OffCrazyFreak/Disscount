export async function drawLogoOverlay(
  canvas: HTMLCanvasElement,
  src: string,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.src = src;
  await img.decode();

  const box = Math.round(Math.min(canvas.width, canvas.height) * 0.22);
  const pad = Math.round(box * 0.18);
  const x = Math.round((canvas.width - box) / 2);
  const y = Math.round((canvas.height - box) / 2);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, box + pad * 2, box + pad * 2, pad);
  ctx.fill();

  const ratio = img.naturalWidth / img.naturalHeight;
  const w = ratio >= 1 ? box : Math.round(box * ratio);
  const h = ratio >= 1 ? Math.round(box / ratio) : box;

  ctx.drawImage(img, x + (box - w) / 2, y + (box - h) / 2, w, h);
}
