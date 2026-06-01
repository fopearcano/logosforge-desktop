/**
 * Screenplay autocomplete popup (foundation). Opens at the caret on Tab in
 * Screenplay mode; keyboard-navigable; selecting inserts the text.
 * Suggestions = static slugs/transitions + character names / scene headings /
 * transitions extracted from the current document.
 */

import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  left: number;
  top: number;
  suggestions: string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function ScreenplayAutocomplete({ open, left, top, suggestions, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setActive(0);
      ref.current?.focus();
    }
  }, [open, suggestions]);

  if (!open || suggestions.length === 0) return null;

  return (
    <div
      ref={ref}
      className="sp-autocomplete"
      style={{ left, top }}
      role="listbox"
      tabIndex={-1}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive((a) => (a + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          onSelect(suggestions[active]);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      {suggestions.map((s, i) => (
        <div
          key={s}
          role="option"
          aria-selected={i === active}
          className={`sp-ac-item${i === active ? ' is-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(s);
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}
