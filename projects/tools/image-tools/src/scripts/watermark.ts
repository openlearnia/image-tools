import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import { detectFormat } from '../lib/image/formats';
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
  const text = getInputValue('watermark-text') || 'Openlearnia';
  const opacity = (parseInt(getInputValue('opacity'), 10) || 50) / 100;
  const fontSize = parseInt(getInputValue('font-size'), 10) || 32;
  const position = getSelectValue('position') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  const format = detectFormat(currentFile);
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await processFile(
      currentFile,
      { watermark: { text, opacity, position, fontSize } },
      { format, quality: 90 },
    );
    lastBlob = result.blob;
    showOutputPreview('preview', result.blob, formatBytes(result.outputBytes));
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Watermark failed');
  }
}

export function initWatermark(): void {
  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    lastBlob = null;
    showOriginalPreview('preview', currentFile);
    runProcess();
  });

  ['watermark-text', 'opacity', 'font-size', 'position'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => currentFile && runProcess());
    document.getElementById(id)?.addEventListener('change', () => currentFile && runProcess());
  });
  document.getElementById('opacity')?.addEventListener('input', () => {
    const label = document.getElementById('opacity-val');
    if (label) label.textContent = getInputValue('opacity');
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      downloadBlob(lastBlob, outputFilename(currentFile.name, detectFormat(currentFile), '-watermarked'));
    });
  }
}
