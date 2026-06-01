/** Shared types for the Logos inline-assistant feature. */

export type LogosActionId =
  | 'suggest'
  | 'rewrite'
  | 'expand'
  | 'explain'
  | 'summarize'
  | 'connect'
  | 'mode';

export type LogosStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export interface LogosRequest {
  action: string;
  prompt?: string;
  selection?: string;
  context?: string;
  mode?: string;
}

export interface LogosResponse {
  ok: boolean;
  action: string;
  output: string;
  provider: string;
  note?: string | null;
}
