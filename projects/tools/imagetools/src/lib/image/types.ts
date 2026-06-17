export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  watermark?: {
    text: string;
    opacity: number;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
    fontSize: number;
  };
}

export interface EncodeOptions {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
}

export interface ProcessInput {
  buffer: ArrayBuffer;
  mimeType: string;
  transform?: TransformOptions;
  encode: EncodeOptions;
}

export interface ProcessOutput {
  buffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
}

export interface MergeInput {
  buffers: ArrayBuffer[];
  mimeTypes: string[];
  direction: 'horizontal' | 'vertical' | 'grid';
  gap: number;
  encode: EncodeOptions;
}

export type WorkerRequest =
  | { id: string; type: 'process'; payload: ProcessInput }
  | { id: string; type: 'merge'; payload: MergeInput }
  | { id: string; type: 'resizeMany'; payload: { buffers: ArrayBuffer[]; mimeTypes: string[]; maxWidth?: number; maxHeight?: number; encode: EncodeOptions } };

export type WorkerResponse =
  | { id: string; ok: true; result: ProcessOutput | ProcessOutput[] }
  | { id: string; ok: false; error: string };
