import { processFile } from '../lib/image/engine';
import { downloadBlob, outputFilename } from '../lib/image/download';
import { detectFormat } from '../lib/image/formats';
import { formatBytes } from '../lib/image/limits';
import {
  getInputValue,
  setPreviewVisible,
  setProcessing,
  setupDropZone,
  showOriginalPreview,
  showOutputPreview,
} from './ui';

const MIN_CROP_PX = 16;
const HANDLE_PX = 10;
const FAST_PREVIEW_MAX = 480;

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

let currentFile: File | null = null;
let lastBlob: Blob | null = null;
let imgW = 0;
let imgH = 0;
let displayScale = 1;
let crop = { x: 0, y: 0, width: 0, height: 0 };
let lockedAspect: number | null = null;
let dragMode: DragMode | null = null;
let isDragging = false;
let dragStart = { x: 0, y: 0, crop: { x: 0, y: 0, width: 0, height: 0 } };
let qualityTimer: ReturnType<typeof setTimeout> | null = null;
let processGen = 0;

const fastPreviewCanvas = document.createElement('canvas');

function clampCrop(rect: typeof crop): typeof crop {
  let { x, y, width, height } = rect;
  width = Math.max(MIN_CROP_PX, Math.min(width, imgW));
  height = Math.max(MIN_CROP_PX, Math.min(height, imgH));
  x = Math.max(0, Math.min(x, imgW - width));
  y = Math.max(0, Math.min(y, imgH - height));
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function drawCropCanvas() {
  const canvas = document.getElementById('crop-canvas') as HTMLCanvasElement;
  if (!canvas || !currentFile) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = document.getElementById('crop-source') as HTMLImageElement;
  if (!img.src || !imgW) return;

  const maxW = 640;
  displayScale = Math.min(1, maxW / imgW);
  canvas.width = Math.round(imgW * displayScale);
  canvas.height = Math.round(imgH * displayScale);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const rx = crop.x * displayScale;
  const ry = crop.y * displayScale;
  const rw = crop.width * displayScale;
  const rh = crop.height * displayScale;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, canvas.width, ry);
  ctx.fillRect(0, ry + rh, canvas.width, canvas.height - ry - rh);
  ctx.fillRect(0, ry, rx, rh);
  ctx.fillRect(rx + rw, ry, canvas.width - rx - rw, rh);

  ctx.strokeStyle = '#6ea8fe';
  ctx.lineWidth = 2;
  ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

  ctx.fillStyle = '#6ea8fe';
  for (const h of getHandlePositions(rx, ry, rw, rh)) {
    ctx.fillRect(h.x - HANDLE_PX / 2, h.y - HANDLE_PX / 2, HANDLE_PX, HANDLE_PX);
  }
}

function getHandlePositions(rx: number, ry: number, rw: number, rh: number) {
  const mx = rx + rw / 2;
  const my = ry + rh / 2;
  return [
    { mode: 'nw' as DragMode, x: rx, y: ry },
    { mode: 'n' as DragMode, x: mx, y: ry },
    { mode: 'ne' as DragMode, x: rx + rw, y: ry },
    { mode: 'e' as DragMode, x: rx + rw, y: my },
    { mode: 'se' as DragMode, x: rx + rw, y: ry + rh },
    { mode: 's' as DragMode, x: mx, y: ry + rh },
    { mode: 'sw' as DragMode, x: rx, y: ry + rh },
    { mode: 'w' as DragMode, x: rx, y: my },
  ];
}

function canvasPoint(canvas: HTMLCanvasElement, e: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function hitTest(canvas: HTMLCanvasElement, e: PointerEvent): DragMode | null {
  const { x, y } = canvasPoint(canvas, e);
  const rx = crop.x * displayScale;
  const ry = crop.y * displayScale;
  const rw = crop.width * displayScale;
  const rh = crop.height * displayScale;

  for (const h of getHandlePositions(rx, ry, rw, rh)) {
    if (Math.abs(x - h.x) <= HANDLE_PX && Math.abs(y - h.y) <= HANDLE_PX) {
      return h.mode;
    }
  }

  if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
    return 'move';
  }
  return null;
}

/** Instant low-res preview — no worker, safe to call every pointermove */
function updateFastPreview() {
  const img = document.getElementById('crop-source') as HTMLImageElement;
  const previewImg = document.getElementById('preview-output') as HTMLImageElement;
  const stats = document.getElementById('preview-output-stats');
  if (!img?.complete || !crop.width || !previewImg) return;

  const scale = Math.min(1, FAST_PREVIEW_MAX / crop.width);
  const pw = Math.max(1, Math.round(crop.width * scale));
  const ph = Math.max(1, Math.round(crop.height * scale));

  fastPreviewCanvas.width = pw;
  fastPreviewCanvas.height = ph;
  const ctx = fastPreviewCanvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, pw, ph);
  setPreviewVisible('preview', true);
  previewImg.src = fastPreviewCanvas.toDataURL('image/jpeg', 0.75);
  previewImg.hidden = false;
  if (stats) {
    stats.textContent = isDragging
      ? `${crop.width}×${crop.height} — release to finalize`
      : `${crop.width}×${crop.height}`;
  }
}

function applyDrag(dx: number, dy: number) {
  const sdx = dx / displayScale;
  const sdy = dy / displayScale;
  const start = dragStart.crop;
  let { x, y, width, height } = { ...start };

  if (dragMode === 'move') {
    x = start.x + sdx;
    y = start.y + sdy;
  } else if (dragMode) {
    if (dragMode.includes('e')) width = start.width + sdx;
    if (dragMode.includes('w')) {
      x = start.x + sdx;
      width = start.width - sdx;
    }
    if (dragMode.includes('s')) height = start.height + sdy;
    if (dragMode.includes('n')) {
      y = start.y + sdy;
      height = start.height - sdy;
    }

    if (lockedAspect && dragMode !== 'move') {
      const ratio = lockedAspect;
      if (dragMode === 'e' || dragMode === 'w') {
        height = width / ratio;
        if (dragMode.includes('n')) y = start.y + start.height - height;
      } else if (dragMode === 'n' || dragMode === 's') {
        width = height * ratio;
        if (dragMode.includes('w')) x = start.x + start.width - width;
      } else {
        height = width / ratio;
        if (dragMode.includes('n')) y = start.y + start.height - height;
        if (dragMode.includes('w')) x = start.x + start.width - width;
      }
    }
  }

  crop = clampCrop({ x, y, width, height });
  drawCropCanvas();
  updateFastPreview();
}

function showCropWorkspace() {
  const wrap = document.getElementById('crop-canvas-wrap');
  if (wrap) wrap.hidden = false;
}

function applyPreset(ratio: number | null) {
  if (!imgW || !imgH) return;
  lockedAspect = ratio;
  if (ratio === null) {
    crop = { x: 0, y: 0, width: imgW, height: imgH };
  } else {
    let w = imgW;
    let h = Math.round(w / ratio);
    if (h > imgH) {
      h = imgH;
      w = Math.round(h * ratio);
    }
    crop = clampCrop({
      x: Math.round((imgW - w) / 2),
      y: Math.round((imgH - h) / 2),
      width: w,
      height: h,
    });
  }
  drawCropCanvas();
  updateFastPreview();
  runProcess();
}

async function runProcess() {
  if (!currentFile || !crop.width) return;

  const gen = ++processGen;
  const format = detectFormat(currentFile);
  const quality = parseInt(getInputValue('quality'), 10) || 90;
  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  setProcessing(btn, true);

  try {
    const result = await processFile(currentFile, { crop }, { format, quality });
    if (gen !== processGen) return;

    lastBlob = result.blob;
    showOutputPreview(
      'preview',
      result.blob,
      `${result.width}×${result.height} — ${formatBytes(result.outputBytes)}`,
    );
    setProcessing(btn, false);
    btn.disabled = false;
  } catch (e) {
    if (gen !== processGen) return;
    setProcessing(btn, false);
    alert(e instanceof Error ? e.message : 'Crop failed');
  }
}

function scheduleQualityProcess() {
  if (qualityTimer) clearTimeout(qualityTimer);
  qualityTimer = setTimeout(() => runProcess(), 400);
}

function setupCropInteraction() {
  const canvas = document.getElementById('crop-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  canvas.addEventListener('pointerdown', (e) => {
    const mode = hitTest(canvas, e);
    if (!mode) return;
    processGen++;
    dragMode = mode;
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY, crop: { ...crop } };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = mode === 'move' ? 'grabbing' : `${mode}-resize`;
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (dragMode) {
      applyDrag(e.clientX - dragStart.x, e.clientY - dragStart.y);
      return;
    }
    const mode = hitTest(canvas, e);
    if (mode === 'move') canvas.style.cursor = 'grab';
    else if (mode) canvas.style.cursor = `${mode}-resize`;
    else canvas.style.cursor = 'crosshair';
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!dragMode) return;
    dragMode = null;
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
    canvas.style.cursor = 'crosshair';
    runProcess();
  });

  canvas.addEventListener('pointercancel', (e) => {
    if (!dragMode) return;
    dragMode = null;
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
    runProcess();
  });

  canvas.addEventListener('pointerleave', () => {
    if (!dragMode) canvas.style.cursor = 'crosshair';
  });
}

export function initCrop(): void {
  setupCropInteraction();

  setupDropZone('drop-zone', (files) => {
    currentFile = files[0];
    lastBlob = null;
    lockedAspect = null;
    const img = document.getElementById('crop-source') as HTMLImageElement;
    img.src = URL.createObjectURL(currentFile);
    img.onload = () => {
      imgW = img.naturalWidth;
      imgH = img.naturalHeight;
      crop = { x: 0, y: 0, width: imgW, height: imgH };
      showCropWorkspace();
      showOriginalPreview('preview', currentFile!);
      drawCropCanvas();
      updateFastPreview();
      runProcess();
    };
  });

  document.querySelectorAll('[data-crop-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = (btn as HTMLElement).dataset.cropPreset;
      applyPreset(val === 'free' ? null : parseFloat(val!));
    });
  });

  document.getElementById('quality')?.addEventListener('input', () => {
    if (currentFile) scheduleQualityProcess();
  });

  const btn = document.getElementById('download-btn') as HTMLButtonElement;
  if (btn) {
    btn.dataset.label = 'Download';
    btn.addEventListener('click', () => {
      if (!lastBlob || !currentFile) return;
      downloadBlob(lastBlob, outputFilename(currentFile.name, detectFormat(currentFile), '-cropped'));
    });
  }
}
