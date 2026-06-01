/** A minimal, keyboard-accessible Writing Mode dropdown + structural vocabulary. */

import type { WritingMode } from './types';

interface Props {
  modes: WritingMode[];
  value: string;
  onChange: (mode: string) => void;
  disabled?: boolean;
}

export function WritingModeSelector({ modes, value, onChange, disabled }: Props) {
  const active = modes.find((m) => m.id === value);
  return (
    <div className="mode-selector">
      <label className="mode-label" htmlFor="writing-mode">
        Mode
      </label>
      <select
        id="writing-mode"
        className="mode-select"
        value={value}
        disabled={disabled || modes.length === 0}
        onChange={(e) => onChange(e.target.value)}
        title="Writing Mode"
      >
        {modes.length === 0 && <option value={value}>{value}</option>}
        {modes.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {active && (
        <span className="mode-vocab" title={active.medium_constraints}>
          {active.structural_units.join(' / ')}
        </span>
      )}
    </div>
  );
}
