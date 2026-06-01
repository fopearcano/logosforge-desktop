/** Shared types for the PSYKE feature. Mirrors the backend DTOs. */

export interface PsykeEntry {
  id: string;
  name: string;
  entry_type: string;
  aliases: string[];
}

export interface PsykeSearchResponse {
  query: string;
  results: PsykeEntry[];
}
