/**
 * Typed bridge to the Electron main process (exposed by the preload script).
 *
 * Includes a graceful fallback so the renderer still works when opened in a
 * plain browser via the Vite dev server (no Electron bridge present).
 */

export type BackendState = 'connecting' | 'connected' | 'error';

export interface BackendStatus {
  state: BackendState;
  baseUrl: string;
  managed: boolean;
  service?: string;
  version?: string;
  apiVersion?: string;
  detail?: string;
}

export interface LogosForgeBridge {
  getBackendStatus(): Promise<BackendStatus>;
  onBackendStatus(cb: (status: BackendStatus) => void): () => void;
}

declare global {
  interface Window {
    logosforge?: LogosForgeBridge;
  }
}

const fallback: LogosForgeBridge = {
  async getBackendStatus() {
    return {
      state: 'error',
      baseUrl: '',
      managed: false,
      detail: 'Not running inside Electron (no native bridge).',
    };
  },
  onBackendStatus() {
    return () => {};
  },
};

export const bridge: LogosForgeBridge = window.logosforge ?? fallback;
