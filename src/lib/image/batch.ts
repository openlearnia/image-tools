import JSZip from 'jszip';
import { downloadBlob } from './download';
import type { ProcessResult } from './engine';
import { FORMAT_EXT, type OutputFormat } from './formats';

export async function downloadZip(
  items: Array<{ result: ProcessResult; filename: string }>,
  zipName = 'images.zip',
): Promise<void> {
  const zip = new JSZip();
  for (const { result, filename } of items) {
    zip.file(filename, result.blob);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipName);
}

export function faviconFilenames(): Array<{ size: number; name: string }> {
  return [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
  ];
}

export async function buildFaviconZip(
  sizes: Array<{ blob: Blob; name: string }>,
): Promise<Blob> {
  const zip = new JSZip();
  for (const { blob, name } of sizes) {
    zip.file(name, blob);
  }
  const ico = await pngToIco(sizes.filter((s) => s.name.includes('16') || s.name.includes('32')));
  if (ico) zip.file('favicon.ico', ico);
  return zip.generateAsync({ type: 'blob' });
}

async function pngToIco(pngs: Array<{ blob: Blob; name: string }>): Promise<Blob | null> {
  if (pngs.length === 0) return null;
  const entries: Array<{ width: number; height: number; data: Uint8Array }> = [];
  for (const png of pngs) {
    const size = png.name.includes('32') ? 32 : 16;
    const buf = new Uint8Array(await png.blob.arrayBuffer());
    entries.push({ width: size, height: size, data: buf });
  }

  const headerSize = 6 + entries.length * 16;
  let offset = headerSize;
  const parts: Uint8Array[] = [];

  const header = new Uint8Array(6 + entries.length * 16);
  const view = new DataView(header.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);

  entries.forEach((entry, i) => {
    const base = 6 + i * 16;
    header[base] = entry.width >= 256 ? 0 : entry.width;
    header[base + 1] = entry.height >= 256 ? 0 : entry.height;
    header[base + 2] = 0;
    header[base + 3] = 0;
    view.setUint16(base + 4, 1, true);
    view.setUint16(base + 6, 32, true);
    view.setUint32(base + 8, entry.data.byteLength, true);
    view.setUint32(base + 12, offset, true);
    offset += entry.data.byteLength;
    parts.push(entry.data);
  });

  const total = new Uint8Array(offset);
  total.set(header, 0);
  let pos = header.byteLength;
  for (const part of parts) {
    total.set(part, pos);
    pos += part.byteLength;
  }
  return new Blob([total], { type: 'image/x-icon' });
}

export function batchOutputName(original: string, format: OutputFormat): string {
  const base = original.replace(/\.[^.]+$/, '');
  return `${base}-processed.${FORMAT_EXT[format]}`;
}
