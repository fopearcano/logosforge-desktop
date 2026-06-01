/**
 * Logos inline assistant — a Codex-style floating box inside the editor.
 *
 * Opens at the caret/selection on Ctrl/Cmd+K, captures context (selection +
 * surrounding block + writing mode), runs quick actions against
 * POST /api/logos/inline, and applies results back into the document via
 * ProseMirror transactions (Replace / Insert below). It is embedded in the
 * writing surface — not a separate chat panel.
 */

import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LOGOS_ACTIONS } from './logosActions';
import type { LogosActionId } from './types';
import { useLogosInline } from './useLogosInline';

interface Props {
  editor: Editor;
  mode: string;
  baseUrl: string;
}

interface Capture {
  from: number;
  to: number;
  selection: string;
  context: string;
  left: number;
  top: number;
}

const BOX_WIDTH = 340;
const BOX_MAX_HEIGHT = 320;

/** Our schema has no hardBreak, so represent multi-line output as paragraphs. */
function outputToParagraphs(output: string) {
  return output.split('\n').map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }));
}

export function LogosFloatingBox({ editor, mode, baseUrl }: Props) {
  const [capture, setCapture] = useState<Capture | null>(null);
  const [prompt, setPrompt] = useState('');
  const promptRef = useRef<HTMLInputElement>(null);
  const { status, output, note, provider, error, run, reset } = useLogosInline({ baseUrl });

  const openRef = useRef(false);
  openRef.current = capture !== null;

  const close = useCallback(() => {
    setCapture(null);
    setPrompt('');
    reset();
  }, [reset]);

  const openAtCaret = useCallback(() => {
    const { from, to } = editor.state.selection;
    const selection = from !== to ? editor.state.doc.textBetween(from, to, '\n') : '';
    const context = editor.state.selection.$from.parent.textContent;
    const coords = editor.view.coordsAtPos(from);

    let left = coords.left;
    if (left + BOX_WIDTH > window.innerWidth - 12) left = window.innerWidth - BOX_WIDTH - 12;
    if (left < 12) left = 12;

    let top = coords.bottom + 6;
    if (top + BOX_MAX_HEIGHT > window.innerHeight - 12) {
      top = Math.max(12, coords.top - BOX_MAX_HEIGHT - 6);
    }

    reset();
    setPrompt('');
    setCapture({ from, to, selection, context, left, top });
  }, [editor, reset]);

  // Ctrl/Cmd+K toggles the box (only opens while the editor is focused). Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && !e.altKey && e.code === 'KeyK') {
        e.preventDefault();
        if (openRef.current) close();
        else if (editor.view.hasFocus()) openAtCaret();
      } else if (e.key === 'Escape' && openRef.current) {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, openAtCaret, close]);

  useEffect(() => {
    if (capture) promptRef.current?.focus();
  }, [capture]);

  const doRun = useCallback(
    (action: LogosActionId, promptText?: string) => {
      if (!capture) return;
      void run({
        action,
        prompt: promptText,
        selection: capture.selection,
        context: capture.context,
        mode,
      });
    },
    [capture, mode, run],
  );

  const applyReplace = useCallback(() => {
    if (!capture || !output) return;
    const { from, to } = capture;
    try {
      if (!output.includes('\n') && to > from) {
        editor.chain().focus().insertContentAt({ from, to }, output).run();
      } else {
        editor.chain().focus().insertContentAt({ from, to }, outputToParagraphs(output)).run();
      }
    } catch {
      /* ignore apply failures */
    }
    close();
  }, [capture, output, editor, close]);

  const applyInsert = useCallback(() => {
    if (!capture || !output) return;
    try {
      const pos = editor.state.doc.resolve(capture.to).after();
      editor.chain().focus().insertContentAt(pos, outputToParagraphs(output)).run();
    } catch {
      editor.chain().focus().insertContentAt(capture.to, outputToParagraphs(output)).run();
    }
    close();
  }, [capture, output, editor, close]);

  if (!capture) return null;

  return (
    <div
      className="logos-box"
      style={{ left: capture.left, top: capture.top }}
      role="dialog"
      aria-label="Logos inline assistant"
    >
      <div className="logos-head">
        <span className="logos-title">Logos</span>
        <button type="button" className="logos-close" onClick={close} title="Close (Esc)" aria-label="Close">
          ×
        </button>
      </div>

      <form
        className="logos-prompt-row"
        onSubmit={(e) => {
          e.preventDefault();
          const p = prompt.trim();
          if (p) doRun('suggest', p);
        }}
      >
        <input
          ref={promptRef}
          className="logos-prompt"
          type="text"
          placeholder={capture.selection ? 'Ask Logos about the selection…' : 'Ask Logos…'}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </form>

      <div className="logos-actions">
        {LOGOS_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className="logos-action"
            title={a.hint}
            disabled={status === 'loading'}
            onClick={() => doRun(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {status === 'loading' && <div className="logos-status">Thinking…</div>}
      {status === 'error' && <div className="logos-status logos-error">Logos error: {error}</div>}

      {status === 'done' && (
        <div className="logos-result">
          <div className="logos-output">{output}</div>
          {provider === 'stub' && note && <div className="logos-note">{note}</div>}
          <div className="logos-apply">
            <button type="button" onClick={applyReplace} disabled={!output}>
              Replace
            </button>
            <button type="button" onClick={applyInsert} disabled={!output}>
              Insert below
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(output)?.catch(() => undefined)}
            >
              Copy
            </button>
            <button type="button" onClick={close}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
