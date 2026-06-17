import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import { detectFormat, type OutputFormat } from '../lib/image/formats';
import { formatBytes } from '../lib/image/limits';
import {
  getInputValue,
  getSelectValue,
  setProcessing,
  setupDropZone,
  showOriginalPreview,
  showOutputPreview,
} from './ui';

let currentFile: File | null = null;
let lastBlob: Blob | null = null;

async function runProcess() {
  if (!currentFile) return;
  const quality = parseInt(getInputValue('quality'), 10) || 80;
  const format = getSelectValue('format') as OutputFormat;
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await processFile(currentFile, undefined, { format, quality });
    lastBlob = result.blob;
    const saved = ((currentFile.size - result.outputBytes) / currentFile.size) * 100;
    showOutputPreview(
      'preview',
      result.blob,
      `${formatBytes(result.outputBytes)} (${saved > 0 ? `−${saved.toFixed(0)}%` : 'same size'})`,
    );
    setProcessing(btn, false);
    btn.disabled = false;
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Processing failed');
  }
}

export function initCompress(): void {
  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    lastBlob = null;
    const formatSelect = document.getElementById('format') as HTMLSelectElement;
    if (formatSelect) formatSelect.value = detectFormat(currentFile);
    showOriginalPreview('preview', currentFile);
    runProcess();
  });

  document.getElementById('quality')?.addEventListener('input', () => {
    const label = document.getElementById('quality-val');
    if (label) label.textContent = getInputValue('quality');
    if (currentFile) runProcess();
  });
  document.getElementById('format')?.addEventListener('change', () => currentFile && runProcess());

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      const format = getSelectValue('format') as OutputFormat;
      downloadBlob(lastBlob, outputFilename(currentFile.name, format, '-compressed'));
    });
  }
}
