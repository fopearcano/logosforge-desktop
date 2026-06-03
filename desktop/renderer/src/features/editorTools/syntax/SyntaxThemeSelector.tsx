/** Syntax-theme dropdown (used inside the Editor Settings popover). */

import type { SyntaxThemeId } from '../editorToolTypes';
import { SYNTAX_THEME_LIST } from './syntaxThemes';

interface Props {
  value: SyntaxThemeId;
  onChange: (id: SyntaxThemeId) => void;
}

export function SyntaxThemeSelector({ value, onChange }: Props) {
  return (
    <select
      className="wb-syntax-theme"
      value={value}
      onChange={(e) => onChange(e.target.value as SyntaxThemeId)}
      aria-label="Syntax theme"
    >
      {SYNTAX_THEME_LIST.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
