import type { EncodeOptions, TransformOptions } from './types';
import { FORMAT_MIME } from './formats';

async function decodeToBitmap(buffer: ArrayBuffer, mimeType: string): Promise<ImageBitmap> {
  const blob = new Blob([buffer], { type: mimeType || 'image/png' });
  return createImageBitmap(blob);
}

async function encodeBitmap(
  bitmap: ImageBitmap,
  encode: EncodeOptions,
): Promise<{ buffer: ArrayBuffer; mimeType: string; width: number; height: number }> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0);
  const mime = FORMAT_MIME[encode.format];
  const quality = encode.format === 'png' ? undefined : encode.quality / 100;
  const blob = await canvas.convertToBlob({ type: mime, quality });
  const buffer = await blob.arrayBuffer();
  return { buffer, mimeType: mime, width: bitmap.width, height: bitmap.height };
}

function applyTransform(bitmap: ImageBitmap, transform?: TransformOptions): ImageBitmap {
  if (!transform) return bitmap;

  let source = bitmap;
  let cropped: ImageBitmap | null = null;

  if (transform.crop) {
    const { x, y, width, height } = transform.crop;
    const cropCanvas = new OffscreenCanvas(width, height);
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) throw new Error('Canvas not supported');
    cropCtx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
    cropped = cropCanvas.transferToImageBitmap();
    source = cropped;
  }

  const targetW = transform.width ?? source.width;
  const targetH = transform.height ?? source.height;
  const rotate = transform.rotate ?? 0;
  const swap = rotate === 90 || rotate === 270;
  const canvasW = swap ? targetH : targetW;
  const canvasH = swap ? targetW : targetH;

  const canvas = new OffscreenCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  const scaleX = transform.flipH ? -1 : 1;
  const scaleY = transform.flipV ? -1 : 1;
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
  if (rotate) ctx.rotate((rotate * Math.PI) / 180);
  ctx.drawImage(source, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();

  if (cropped) cropped.close();

  if (transform.watermark?.text) {
    const { text, opacity, position, fontSize } = transform.watermark;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    const metrics = ctx.measureText(text);
    const pad = 16;
    let x = pad;
    let y = pad + fontSize;
    if (position.includes('right')) x = canvasW - metrics.width - pad;
    if (position.includes('bottom')) y = canvasH - pad;
    if (position === 'center') {
      x = (canvasW - metrics.width) / 2;
      y = canvasH / 2;
    }
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  return canvas.transferToImageBitmap();
}

export async function processImage(
  buffer: ArrayBuffer,
  mimeType: string,
  transform: TransformOptions | undefined,
  encode: EncodeOptions,
) {
  const bitmap = await decodeToBitmap(buffer, mimeType);
  const transformed = applyTransform(bitmap, transform);
  if (transformed !== bitmap) bitmap.close();
  try {
    return await encodeBitmap(transformed, encode);
  } finally {
    transformed.close();
  }
}

export async function mergeImages(
  buffers: ArrayBuffer[],
  mimeTypes: string[],
  direction: 'horizontal' | 'vertical' | 'grid',
  gap: number,
  encode: EncodeOptions,
) {
  const bitmaps = await Promise.all(buffers.map((b, i) => decodeToBitmap(b, mimeTypes[i])));
  try {
    const cols =
      direction === 'grid'
        ? Math.ceil(Math.sqrt(bitmaps.length))
        : direction === 'horizontal'
          ? bitmaps.length
          : 1;
    const rows =
      direction === 'grid'
        ? Math.ceil(bitmaps.length / cols)
        : direction === 'vertical'
          ? bitmaps.length
          : 1;

    const cellW = Math.max(...bitmaps.map((b) => b.width));
    const cellH = Math.max(...bitmaps.map((b) => b.height));
    const canvasW = cols * cellW + (cols - 1) * gap;
    const canvasH = rows * cellH + (rows - 1) * gap;

    const canvas = new OffscreenCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    bitmaps.forEach((bmp, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (cellW + gap) + (cellW - bmp.width) / 2;
      const y = row * (cellH + gap) + (cellH - bmp.height) / 2;
      ctx.drawImage(bmp, x, y);
    });

    const merged = canvas.transferToImageBitmap();
    try {
      return await encodeBitmap(merged, encode);
    } finally {
      merged.close();
    }
  } finally {
    bitmaps.forEach((b) => b.close());
  }
}

export async function resizeMany(
  buffers: ArrayBuffer[],
  mimeTypes: string[],
  maxWidth: number | undefined,
  maxHeight: number | undefined,
  encode: EncodeOptions,
) {
  const results = [];
  for (let i = 0; i < buffers.length; i++) {
    const bitmap = await decodeToBitmap(buffers[i], mimeTypes[i]);
    let w = bitmap.width;
    let h = bitmap.height;
    if (maxWidth && w > maxWidth) {
      h = Math.round((h * maxWidth) / w);
      w = maxWidth;
    }
    if (maxHeight && h > maxHeight) {
      w = Math.round((w * maxHeight) / h);
      h = maxHeight;
    }
    const transform: TransformOptions | undefined =
      w !== bitmap.width || h !== bitmap.height ? { width: w, height: h } : undefined;
    const transformed = applyTransform(bitmap, transform);
    if (transformed !== bitmap) bitmap.close();
    try {
      results.push(await encodeBitmap(transformed, encode));
    } finally {
      transformed.close();
    }
  }
  return results;
}
