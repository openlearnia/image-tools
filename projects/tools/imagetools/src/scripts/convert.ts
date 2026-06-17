import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import type { OutputFormat } from '../lib/image/formats';
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
  const format = getSelectValue('format') as OutputFormat;
  const quality = parseInt(getInputValue('quality'), 10) || 90;
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await processFile(currentFile, undefined, { format, quality });
    lastBlob = result.blob;
    showOutputPreview('preview', result.blob, `${format.toUpperCase()} — ${formatBytes(result.outputBytes)}`);
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Conversion failed');
  }
}

export function initConvert(): void {
  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    lastBlob = null;
    showOriginalPreview('preview', currentFile);
    runProcess();
  });

  document.getElementById('format')?.addEventListener('change', () => currentFile && runProcess());
  document.getElementById('quality')?.addEventListener('input', () => {
    const label = document.getElementById('quality-val');
    if (label) label.textContent = getInputValue('quality');
    if (currentFile) runProcess();
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      downloadBlob(lastBlob, outputFilename(currentFile.name, getSelectValue('format') as OutputFormat, '-converted'));
    });
  }
}
