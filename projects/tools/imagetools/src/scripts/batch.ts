import { batchProcessFiles } from '../lib/image/engine';
import { batchOutputName, downloadZip } from '../lib/image/batch';
import { formatBytes } from '../lib/image/limits';
import {
  getInputNumber,
  getInputValue,
  getSelectValue,
  setProcessing,
  setupDropZone,
} from './ui';
import type { OutputFormat } from '../lib/image/formats';

let currentFiles: File[] = [];

async function runBatch() {
  if (!currentFiles.length) return;
  const mode = getSelectValue('batch-mode');
  const format = getSelectValue('format') as OutputFormat;
  const quality = parseInt(getInputValue('quality'), 10) || 80;
  const maxWidth = mode === 'resize' ? getInputNumber('max-width') : undefined;
  const maxHeight = mode === 'resize' ? getInputNumber('max-height') : undefined;

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  const status = document.getElementById('batch-status');
  try {
    if (status) status.textContent = `Processing ${currentFiles.length} files…`;
    const results = await batchProcessFiles(currentFiles, { maxWidth, maxHeight, quality, format });
    const items = results.map((result, i) => ({
      result,
      filename: batchOutputName(currentFiles[i].name, format),
    }));
    const totalIn = currentFiles.reduce((s, f) => s + f.size, 0);
    const totalOut = results.reduce((s, r) => s + r.outputBytes, 0);
    if (status) {
      status.textContent = `Done — ${formatBytes(totalIn)} → ${formatBytes(totalOut)}`;
    }
    await downloadZip(items, 'batch-images.zip');
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    if (status) status.textContent = '';
    alert(e instanceof Error ? e.message : 'Batch processing failed');
  }
}

export function initBatch(): void {
  setupDropZone(
    'drop-zone',
    (files) => {
      currentFiles = files;
      const list = document.getElementById('file-list');
      if (list) list.textContent = `${files.length} file(s) selected`;
    },
    { multiple: true },
  );

  document.getElementById('quality')?.addEventListener('input', () => {
    const label = document.getElementById('quality-val');
    if (label) label.textContent = getInputValue('quality');
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Process & download ZIP';
    btn.addEventListener('click', () => runBatch());
  }
}
