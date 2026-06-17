import { validateDimensions, validateFile, formatBytes } from '../lib/image/limits';

let previewOriginalUrl: string | null = null;
let previewOutputUrl: string | null = null;

export function revokePreviewUrls(): void {
  if (previewOriginalUrl) URL.revokeObjectURL(previewOriginalUrl);
  if (previewOutputUrl) URL.revokeObjectURL(previewOutputUrl);
  previewOriginalUrl = null;
  previewOutputUrl = null;
}

export function setupDropZone(
  zoneId: string,
  onFiles: (files: File[]) => void,
  options: { multiple?: boolean } = {},
): void {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(`${zoneId}-input`) as HTMLInputElement | null;
  const errorEl = document.getElementById(`${zoneId}-error`);
  if (!zone || !input) return;

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    const valid: File[] = [];
    for (const file of list) {
      const err = validateFile(file);
      if (err) {
        if (errorEl) {
          errorEl.textContent = err;
          errorEl.hidden = false;
        }
        return;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const dimErr = validateDimensions(bitmap.width, bitmap.height);
        bitmap.close();
        if (dimErr) {
          if (errorEl) {
            errorEl.textContent = dimErr;
            errorEl.hidden = false;
          }
          return;
        }
      } catch {
        if (errorEl) {
          errorEl.textContent = 'Could not read image file.';
          errorEl.hidden = false;
        }
        return;
      }
      valid.push(file);
    }

    onFiles(options.multiple ? valid : [valid[0]]);
  };

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer?.files.length) handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', () => {
    if (input.files?.length) handleFiles(input.files);
  });
}

export function setPreviewVisible(previewId: string, visible: boolean): void {
  const row = document.getElementById(previewId);
  if (row) row.hidden = !visible;
}

export function showOriginalPreview(previewId: string, file: File): void {
  const img = document.getElementById(`${previewId}-original`) as HTMLImageElement;
  const stats = document.getElementById(`${previewId}-original-stats`);
  if (!img || !stats) return;

  setPreviewVisible(previewId, true);
  revokePreviewUrls();
  previewOriginalUrl = URL.createObjectURL(file);
  img.src = previewOriginalUrl;
  img.hidden = false;
  stats.textContent = `${file.name} — ${formatBytes(file.size)}`;
}

export function showOutputPreview(previewId: string, blob: Blob, label?: string): void {
  const img = document.getElementById(`${previewId}-output`) as HTMLImageElement;
  const stats = document.getElementById(`${previewId}-output-stats`);
  if (!img || !stats) return;

  setPreviewVisible(previewId, true);
  if (previewOutputUrl) URL.revokeObjectURL(previewOutputUrl);
  previewOutputUrl = URL.createObjectURL(blob);
  img.src = previewOutputUrl;
  img.hidden = false;
  stats.textContent = label ?? formatBytes(blob.size);
}

export function setProcessing(button: HTMLButtonElement | null, processing: boolean): void {
  if (!button) return;
  button.disabled = processing;
  button.textContent = processing ? 'Processing…' : button.dataset.label ?? 'Download';
}

export function getInputNumber(id: string): number | undefined {
  const el = document.getElementById(id) as HTMLInputElement;
  const v = parseInt(el?.value ?? '', 10);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

export function getInputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement)?.value ?? '';
}

export function getSelectValue(id: string): string {
  return (document.getElementById(id) as HTMLSelectElement)?.value ?? '';
}
