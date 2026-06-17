import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import { detectFormat } from '../lib/image/formats';
import { formatBytes } from '../lib/image/limits';
import { setProcessing, setupDropZone, showOriginalPreview, showOutputPreview } from './ui';
import type { TransformOptions } from '../lib/image/types';

let currentFile: File | null = null;
let lastBlob: Blob | null = null;
let transform: TransformOptions = {};

async function runProcess() {
  if (!currentFile) return;
  const format = detectFormat(currentFile);
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await processFile(currentFile, transform, { format, quality: 95 });
    lastBlob = result.blob;
    showOutputPreview('preview', result.blob, `${result.width}×${result.height} — ${formatBytes(result.outputBytes)}`);
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Transform failed');
  }
}

export function initRotate(): void {
  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    lastBlob = null;
    transform = {};
    showOriginalPreview('preview', currentFile);
    runProcess();
  });

  document.querySelectorAll('[data-rotate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const deg = parseInt((btn as HTMLElement).dataset.rotate!, 10) as 0 | 90 | 180 | 270;
      transform = { ...transform, rotate: deg };
      if (currentFile) runProcess();
    });
  });

  document.getElementById('flip-h')?.addEventListener('click', () => {
    transform = { ...transform, flipH: !transform.flipH };
    if (currentFile) runProcess();
  });
  document.getElementById('flip-v')?.addEventListener('click', () => {
    transform = { ...transform, flipV: !transform.flipV };
    if (currentFile) runProcess();
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      downloadBlob(lastBlob, outputFilename(currentFile.name, detectFormat(currentFile), '-rotated'));
    });
  }
}
