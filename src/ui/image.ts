export interface Prepared {
  /** Re-encoded for upload: JPEG, longest side 1600px. Falls back to the original if it cannot be decoded. */
  blob: Blob;
  /** Tiny preview to show the host and store with the bill. */
  thumb: string | null;
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

function draw(src: ImageBitmap | HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const w = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h = "naturalHeight" in src ? src.naturalHeight : src.height;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * k));
  c.height = Math.max(1, Math.round(h * k));
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

const toBlob = (c: HTMLCanvasElement, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", q));

/** Phone photos are 3 to 8 MB; the reader does not need that. Smaller uploads are faster on mobile data. */
export async function prepareImage(file: File): Promise<Prepared> {
  try {
    const src = await decode(file);
    const big = await toBlob(draw(src, 1600), 0.85);
    const thumb = draw(src, 160).toDataURL("image/jpeg", 0.6);
    if (big && big.size > 0) return { blob: big, thumb };
    return { blob: file, thumb };
  } catch {
    return { blob: file, thumb: null };
  }
}
