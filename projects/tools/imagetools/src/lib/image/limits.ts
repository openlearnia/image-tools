export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_DIMENSION = 8000;

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp)$/i;

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return `File exceeds ${formatBytes(MAX_FILE_BYTES)} limit (${formatBytes(file.size)}).`;
  }
  if (!ACCEPTED_TYPES.has(file.type) && !ACCEPTED_EXTENSIONS.test(file.name)) {
    return 'Unsupported file type. Use JPEG, PNG, WebP, GIF, or BMP.';
  }
  return null;
}

export function validateDimensions(width: number, height: number): string | null {
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return `Image dimensions exceed ${MAX_DIMENSION}px (${width}×${height}).`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
