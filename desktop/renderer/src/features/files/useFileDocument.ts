/**
 * Desktop document file state: current file path, dirty flag, save status, and
 * the New / Open / Save / Save As / Close operations (wired to the native File
 * menu). Backend autosave keeps the live session; these write user-chosen files.
 *
 * Loading a file replaces the editor content (which then autosaves to the
 * backend too), so the session copy stays in sync.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { WhiteboardBlock } from '../whiteboard/types';
import { fileApi, onMenuFile, onMenuOpenRecent } from './fileApi';
import { baseName, blocksToText, suggestedFileName, textToBlocks } from './fileSerialize';
import type { FileStatus } from './fileTypes';

const BLANK: WhiteboardBlock[] = [{ id: 'b0', type: 'paragraph', text: '' }];

interface Options {
  getBlocks: () => WhiteboardBlock[];
  loadBlocks: (blocks: WhiteboardBlock[]) => void;
  mode: string;
}

export interface FileDocApi {
  filePath: string | null;
  fileName: string;
  dirty: boolean;
  status: FileStatus;
  /** Called by the editor on every user edit. */
  markDirty: () => void;
  newDocument: () => void;
  openDocument: () => void;
  saveDocument: () => void;
  saveDocumentAs: () => void;
  closeDocument: () => void;
}

export function useFileDocument({ getBlocks, loadBlocks, mode }: Options): FileDocApi {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<FileStatus>('saved');

  const getBlocksRef = useRef(getBlocks);
  getBlocksRef.current = getBlocks;
  const loadBlocksRef = useRef(loadBlocks);
  loadBlocksRef.current = loadBlocks;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const filePathRef = useRef(filePath);
  filePathRef.current = filePath;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const suppressDirty = useRef(false);

  const markDirty = useCallback(() => {
    if (suppressDirty.current) return;
    setDirty(true);
    setStatus('unsaved');
  }, []);

  const loadInto = useCallback((blocks: WhiteboardBlock[], path: string | null) => {
    suppressDirty.current = true;
    loadBlocksRef.current(blocks);
    setFilePath(path);
    setDirty(false);
    setStatus('saved');
    // Re-enable dirty tracking once the programmatic load's update has flushed.
    setTimeout(() => {
      suppressDirty.current = false;
    }, 0);
  }, []);

  const doSaveAs = useCallback(async (): Promise<boolean> => {
    const text = blocksToText(getBlocksRef.current());
    setStatus('saving');
    const res = await fileApi.saveAs(suggestedFileName(filePathRef.current, modeRef.current), text);
    if (!res) {
      setStatus(dirtyRef.current ? 'unsaved' : 'saved'); // cancelled
      return false;
    }
    if (res.error) {
      setStatus('error');
      return false;
    }
    setFilePath(res.path);
    setDirty(false);
    setStatus('saved');
    return true;
  }, []);

  const doSave = useCallback(async (): Promise<boolean> => {
    const path = filePathRef.current;
    if (!path) return doSaveAs();
    setStatus('saving');
    const res = await fileApi.save(path, blocksToText(getBlocksRef.current()));
    if (!res.ok) {
      setStatus('error');
      return false;
    }
    setDirty(false);
    setStatus('saved');
    return true;
  }, [doSaveAs]);

  // If there are unsaved changes, ask; returns false to abort the operation.
  const confirmProceed = useCallback(async (): Promise<boolean> => {
    if (!dirtyRef.current) return true;
    const choice = await fileApi.confirmUnsaved();
    if (choice === 'cancel') return false;
    if (choice === 'save') return doSave();
    return true; // dont-save
  }, [doSave]);

  const newDocument = useCallback(async () => {
    if (await confirmProceed()) loadInto(BLANK, null);
  }, [confirmProceed, loadInto]);

  const openDocument = useCallback(async () => {
    if (!(await confirmProceed())) return;
    const doc = await fileApi.open();
    if (doc) loadInto(textToBlocks(doc.content), doc.path);
  }, [confirmProceed, loadInto]);

  const openPathDocument = useCallback(
    async (p: string) => {
      if (!(await confirmProceed())) return;
      const doc = await fileApi.openPath(p);
      if (doc) loadInto(textToBlocks(doc.content), doc.path);
      else setStatus('error');
    },
    [confirmProceed, loadInto],
  );

  const closeDocument = useCallback(async () => {
    if (await confirmProceed()) loadInto(BLANK, null);
  }, [confirmProceed, loadInto]);

  // Native File-menu actions.
  useEffect(() => {
    const offFile = onMenuFile((action) => {
      if (action === 'new') void newDocument();
      else if (action === 'open') void openDocument();
      else if (action === 'save') void doSave();
      else if (action === 'saveAs') void doSaveAs();
      else if (action === 'close') void closeDocument();
    });
    const offRecent = onMenuOpenRecent((p) => void openPathDocument(p));
    return () => {
      offFile();
      offRecent();
    };
  }, [newDocument, openDocument, doSave, doSaveAs, closeDocument, openPathDocument]);

  return {
    filePath,
    fileName: filePath ? baseName(filePath) : 'Untitled',
    dirty,
    status,
    markDirty,
    newDocument: () => void newDocument(),
    openDocument: () => void openDocument(),
    saveDocument: () => void doSave(),
    saveDocumentAs: () => void doSaveAs(),
    closeDocument: () => void closeDocument(),
  };
}
