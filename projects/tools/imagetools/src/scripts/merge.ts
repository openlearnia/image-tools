import { mergeFiles } from '../lib/image/engine';
import { downloadBlob } from '../lib/image/download';
import { formatBytes } from '../lib/image/limits';
import {
  getInputValue,
  getSelectValue,
  setProcessing,
  setupDropZone,
  showOutputPreview,
} from './ui';

let currentFiles: File[] = [];
let lastBlob: Blob | null = null;

async function runProcess() {
  if (currentFiles.length < 2) return;
  const direction = getSelectValue('direction') as 'horizontal' | 'vertical' | 'grid';
  const gap = parseInt(getInputValue('gap'), 10) || 8;
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await mergeFiles(currentFiles, direction, gap, { format: 'png', quality: 95 });
    lastBlob = result.blob;
    showOutputPreview('preview', result.blob, `${result.width}×${result.height} — ${formatBytes(result.outputBytes)}`);
    setProcessing(btn, false);
    btn.disabled = false;
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Merge failed');
  }
}

export function initMerge(): void {
  setupDropZone(
    'drop-zone',
    (files) => {
      currentFiles = files;
      lastBlob = null;
      const list = document.getElementById('file-list');
      if (list) list.textContent = files.map((f) => f.name).join(', ');
      runProcess();
    },
    { multiple: true },
  );

  ['direction', 'gap'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => currentFiles.length >= 2 && runProcess());
    document.getElementById(id)?.addEventListener('input', () => currentFiles.length >= 2 && runProcess());
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download collage';
    btn.addEventListener('click', () => {
      if (!lastBlob) return;
      downloadBlob(lastBlob, 'collage.png');
    });
  }
}
