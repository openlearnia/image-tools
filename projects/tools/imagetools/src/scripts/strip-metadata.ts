import exifr from 'exifr';
import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import { detectFormat } from '../lib/image/formats';
import { formatBytes } from '../lib/image/limits';
import { setProcessing, setupDropZone, showOriginalPreview, showOutputPreview } from './ui';

let currentFile: File | null = null;
let lastBlob: Blob | null = null;

async function showExif(file: File) {
  const el = document.getElementById('exif-info');
  if (!el) return;
  try {
    const data = await exifr.parse(file, { pick: ['Make', 'Model', 'DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'] });
    if (!data || Object.keys(data).length === 0) {
      el.textContent = 'No EXIF metadata found.';
      return;
    }
    el.textContent = JSON.stringify(data, null, 2);
  } catch {
    el.textContent = 'Could not read metadata.';
  }
}

async function runProcess() {
  if (!currentFile) return;
  const format = detectFormat(currentFile);
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const result = await processFile(currentFile, undefined, { format, quality: 95 });
    lastBlob = result.blob;
    showOutputPreview('preview', result.blob, `Stripped — ${formatBytes(result.outputBytes)}`);
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Failed to strip metadata');
  }
}

export function initStripMetadata(): void {
  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    lastBlob = null;
    showOriginalPreview('preview', currentFile);
    showExif(currentFile);
    runProcess();
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download clean copy';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      downloadBlob(lastBlob, outputFilename(currentFile.name, detectFormat(currentFile), '-clean'));
    });
  }
}
