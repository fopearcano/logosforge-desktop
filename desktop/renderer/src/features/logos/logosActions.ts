/** The Logos quick actions shown in the floating box. */

import type { LogosActionId } from './types';

export interface LogosActionDef {
  id: LogosActionId;
  label: string;
  hint: string;
}

export const LOGOS_ACTIONS: LogosActionDef[] = [
  { id: 'suggest', label: 'Suggest', hint: 'Ideas for what comes next' },
  { id: 'rewrite', label: 'Rewrite', hint: 'Reword the selection' },
  { id: 'expand', label: 'Expand', hint: 'Add detail to the selection' },
  { id: 'explain', label: 'Explain', hint: 'Explain the selected passage' },
  { id: 'summarize', label: 'Summarize', hint: 'Condense the selection' },
  { id: 'connect', label: 'Connect', hint: 'Find related PSYKE entries' },
  { id: 'mode', label: 'Mode pass', hint: 'Apply writing-mode conventions' },
];
