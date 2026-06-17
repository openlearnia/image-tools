import { mergeImages, processImage, resizeMany } from './worker-core';
import type { WorkerRequest, WorkerResponse } from './types';

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    let result;
    if (msg.type === 'process') {
      const { buffer, mimeType, transform, encode } = msg.payload;
      result = await processImage(buffer, mimeType, transform, encode);
    } else if (msg.type === 'merge') {
      const { buffers, mimeTypes, direction, gap, encode } = msg.payload;
      result = await mergeImages(buffers, mimeTypes, direction, gap, encode);
    } else if (msg.type === 'resizeMany') {
      const { buffers, mimeTypes, maxWidth, maxHeight, encode } = msg.payload;
      result = await resizeMany(buffers, mimeTypes, maxWidth, maxHeight, encode);
    } else {
      throw new Error('Unknown worker request');
    }
    const response: WorkerResponse = { id: msg.id, ok: true, result };
    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : 'Processing failed',
    };
    self.postMessage(response);
  }
};
