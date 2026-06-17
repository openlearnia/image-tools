import type { EncodeOptions, MergeInput, ProcessInput, ProcessOutput, TransformOptions, WorkerRequest, WorkerResponse } from './types';
import ImageWorker from './worker.ts?worker';

let worker: Worker | null = null;
let poolBusy = false;
const queue: Array<() => void> = [];

function getWorker(): Worker {
  if (!worker) {
    worker = new ImageWorker();
  }
  return worker;
}

function runInWorker<T extends WorkerRequest['type']>(
  type: T,
  payload: Extract<WorkerRequest, { type: T }>['payload'],
): Promise<ProcessOutput | ProcessOutput[]> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      poolBusy = true;
      const id = crypto.randomUUID();
      const w = getWorker();

      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id) return;
        w.removeEventListener('message', onMessage);
        poolBusy = false;
        const next = queue.shift();
        if (next) next();

        if (event.data.ok) {
          resolve(event.data.result);
        } else {
          reject(new Error(event.data.error));
        }
      };

      w.addEventListener('message', onMessage);
      w.postMessage({ id, type, payload } as WorkerRequest);
    };

    if (poolBusy) {
      queue.push(execute);
    } else {
      execute();
    }
  });
}

export interface ProcessResult {
  blob: Blob;
  width: number;
  height: number;
  outputBytes: number;
}

function toResult(output: ProcessOutput): ProcessResult {
  return {
    blob: new Blob([output.buffer], { type: output.mimeType }),
    width: output.width,
    height: output.height,
    outputBytes: output.buffer.byteLength,
  };
}

export async function processFile(
  file: File,
  transform: TransformOptions | undefined,
  encode: EncodeOptions,
): Promise<ProcessResult> {
  const buffer = await file.arrayBuffer();
  const output = (await runInWorker('process', {
    buffer,
    mimeType: file.type,
    transform,
    encode,
  })) as ProcessOutput;
  return toResult(output);
}

export async function mergeFiles(
  files: File[],
  direction: MergeInput['direction'],
  gap: number,
  encode: EncodeOptions,
): Promise<ProcessResult> {
  const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
  const mimeTypes = files.map((f) => f.type);
  const output = (await runInWorker('merge', {
    buffers,
    mimeTypes,
    direction,
    gap,
    encode,
  })) as ProcessOutput;
  return toResult(output);
}

export async function batchProcessFiles(
  files: File[],
  options: { maxWidth?: number; maxHeight?: number; quality: number; format: EncodeOptions['format'] },
): Promise<ProcessResult[]> {
  const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
  const mimeTypes = files.map((f) => f.type);
  const outputs = (await runInWorker('resizeMany', {
    buffers,
    mimeTypes,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    encode: { format: options.format, quality: options.quality },
  })) as ProcessOutput[];
  return outputs.map(toResult);
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}
