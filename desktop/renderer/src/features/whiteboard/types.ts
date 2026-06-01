/** Shared types for the Whiteboard feature. Mirrors the backend DTOs. */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface WhiteboardBlock {
  id: string;
  /** 'paragraph' | 'heading' (other types are tolerated and treated as paragraphs). */
  type: string;
  text: string;
  level?: number | null;
  /** Screenplay element type on a paragraph (Screenplay mode); persists. */
  sp?: string | null;
}

export interface WhiteboardDocument {
  id: string;
  title: string;
  mode: string;
  blocks: WhiteboardBlock[];
  updated_at: string;
}

export interface WhiteboardUpdate {
  title?: string;
  mode?: string;
  blocks?: WhiteboardBlock[];
}
