export type OutputFormat = 'jpeg' | 'png' | 'webp';

export const FORMAT_MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const FORMAT_EXT: Record<OutputFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export function detectFormat(file: File): OutputFormat {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpeg';
}

export function outputFilename(originalName: string, format: OutputFormat, suffix = ''): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}${suffix}.${FORMAT_EXT[format]}`;
}

export function mimeToFormat(mime: string): OutputFormat {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpeg';
}
