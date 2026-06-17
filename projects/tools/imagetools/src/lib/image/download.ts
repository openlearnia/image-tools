import { FORMAT_EXT, type OutputFormat } from './formats';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function outputFilename(originalName: string, format: OutputFormat, suffix = ''): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}${suffix}.${FORMAT_EXT[format]}`;
}
