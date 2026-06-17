import { processFile } from '../lib/image/engine';
import { downloadBlob } from '../lib/image/download';
import { buildFaviconZip, faviconFilenames } from '../lib/image/batch';
import { setProcessing, setupDropZone, showOriginalPreview } from './ui';

let currentFile: File | null = null;

async function generate() {
  if (!currentFile) return;
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);
  try {
    const sizes = faviconFilenames();
    const blobs: Array<{ blob: Blob; name: string }> = [];
    for (const { size, name } of sizes) {
      const result = await processFile(currentFile, { width: size, height: size }, { format: 'png', quality: 95 });
      blobs.push({ blob: result.blob, name });
    }
    const zip = await buildFaviconZip(blobs);
    downloadBlob(zip, 'favicon-pack.zip');
    setProcessing(btn, false);
  } catch (e) {
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Favicon generation failed');
  }
}

export function initFavicon(): void {
  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    showOriginalPreview('preview', currentFile);
    const list = document.getElementById('size-list');
    if (list) {
      list.innerHTML = faviconFilenames()
        .map((s) => `<li>${s.name} (${s.size}×${s.size})</li>`)
        .join('');
    }
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download ZIP';
    btn.addEventListener('click', () => generate());
  }
}
