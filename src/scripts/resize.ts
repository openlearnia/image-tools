import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import { detectFormat, type OutputFormat } from '../lib/image/formats';
import { formatBytes } from '../lib/image/limits';
import {
  getInputNumber,
  getInputValue,
  getSelectValue,
  setProcessing,
  setupDropZone,
  showOriginalPreview,
  showOutputPreview,
} from './ui';
import { getImageDimensions } from '../lib/image/engine';

let currentFile: File | null = null;
let lastBlob: Blob | null = null;
let aspect = 1;

async function runProcess() {
  if (!currentFile) return;
  const mode = getSelectValue('resize-mode');
  let width: number | undefined;
  let height: number | undefined;

  if (mode === 'percent') {
    const pct = parseInt(getInputValue('percent'), 10) || 100;
    const dims = await getImageDimensions(currentFile);
    width = Math.round((dims.width * pct) / 100);
    height = Math.round((dims.height * pct) / 100);
  } else if (mode === 'width') {
    width = getInputNumber('width');
    if (width && document.getElementById('lock-aspect')?.getAttribute('data-checked') !== 'false') {
      height = Math.round(width / aspect);
    }
  } else {
    height = getInputNumber('height');
    if (height && document.getElementById('lock-aspect')?.getAttribute('data-checked') !== 'false') {
      width = Math.round(height * aspect);
    }
  }

  if (!width && !height) return;

  const format = getSelectValue('format') as OutputFormat;
  const quality = parseInt(getInputValue('quality'), 10) || 85;
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await processFile(currentFile, { width, height }, { format, quality });
    lastBlob = result.blob;
    showOutputPreview('preview', result.blob, `${result.width}×${result.height} — ${formatBytes(result.outputBytes)}`);
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Processing failed');
  }
}

export function initResize(): void {
  setupDropZone('drop-zone', async (files) => {
    currentFile = files[0];
    lastBlob = null;
    const dims = await getImageDimensions(currentFile);
    aspect = dims.width / dims.height;
    const wInput = document.getElementById('width') as HTMLInputElement;
    const hInput = document.getElementById('height') as HTMLInputElement;
    if (wInput) wInput.value = String(dims.width);
    if (hInput) hInput.value = String(dims.height);
    showOriginalPreview('preview', currentFile);
    runProcess();
  });

  ['resize-mode', 'width', 'height', 'percent', 'format', 'quality'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => currentFile && runProcess());
    document.getElementById(id)?.addEventListener('change', () => currentFile && runProcess());
  });

  document.getElementById('lock-aspect')?.addEventListener('click', (e) => {
    const el = e.currentTarget as HTMLElement;
    const checked = el.dataset.checked !== 'false';
    el.dataset.checked = checked ? 'false' : 'true';
    el.textContent = checked ? 'Unlock aspect' : 'Lock aspect';
    if (currentFile) runProcess();
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      downloadBlob(lastBlob, outputFilename(currentFile.name, getSelectValue('format') as OutputFormat, '-resized'));
    });
  }
}
