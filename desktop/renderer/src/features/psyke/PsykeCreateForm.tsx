/** Minimal "New PSYKE element" form — shared shape (type/name/description/notes). */

import { useState } from 'react';

import { createPsykeElement } from './psykeApi';
import type { PsykeElementType, PsykeEntry } from './types';

const TYPES: { value: PsykeElementType; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'place', label: 'Place' },
  { value: 'object', label: 'Object' },
  { value: 'lore', label: 'Lore' },
  { value: 'theme', label: 'Theme' },
  { value: 'other', label: 'Other' },
];

interface Props {
  baseUrl: string;
  /** Optional prefill (e.g. the current search query / editor selection). */
  seed?: string;
  onCreated: (element: PsykeEntry) => void;
  onCancel: () => void;
}

export function PsykeCreateForm({ baseUrl, seed = '', onCreated, onCancel }: Props) {
  // Short seed → a name; long seed → a description (Part 5: add-from-selection).
  const short = seed.length > 0 && seed.length <= 60;
  const [type, setType] = useState<PsykeElementType>('character');
  const [name, setName] = useState(short ? seed : '');
  const [description, setDescription] = useState(short ? '' : seed);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createPsykeElement(baseUrl, {
        type,
        name: name.trim(),
        description: description.trim(),
        notes: notes.trim(),
      });
      if (!res.ok) {
        setError('Could not save the element.');
        setSaving(false);
        return;
      }
      onCreated(res.element);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  return (
    <form
      className="psyke-create"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="psyke-create-title">New PSYKE element</div>

      <label className="psyke-field">
        <span>Type</span>
        <select value={type} onChange={(e) => setType(e.target.value as PsykeElementType)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="psyke-field psyke-field-col">
        <span>Name</span>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Name" />
      </label>

      <label className="psyke-field psyke-field-col">
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Short description"
        />
      </label>

      <label className="psyke-field psyke-field-col">
        <span>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes"
        />
      </label>

      {error && <p className="psyke-hint psyke-error">{error}</p>}

      <div className="psyke-create-actions">
        <button type="button" className="psyke-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="psyke-btn psyke-btn-primary" disabled={!canSave}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
