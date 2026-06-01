/** Shared types for the Outline feature. Mirrors the backend DTOs. */

export interface OutlineItem {
  id: string;
  title: string;
  level: number;
  block_id?: string | null;
}

export interface OutlineResponse {
  items: OutlineItem[];
}
