import { useState, useCallback } from 'react';
import type { SlideType } from '../../types/proposal';
import { snippets } from '../templates/sectionSnippets';
import exampleProposalMd from '../templates/exampleProposal.md?raw';

export type IngestorMode = 'new' | 'import';

export interface UseIngestorStateReturn {
  isOpen: boolean;
  open: (mode: IngestorMode, initialContent?: string) => void;
  close: () => void;
  mode: IngestorMode;
  editorContent: string;
  setEditorContent: (content: string) => void;
  insertSnippet: (type: SlideType) => void;
  loadExample: () => void;
  cursorPosition: number;
  setCursorPosition: (pos: number) => void;
}

export function useIngestorState(): UseIngestorStateReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<IngestorMode>('new');
  const [editorContent, setEditorContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const open = useCallback((newMode: IngestorMode, initialContent?: string) => {
    setMode(newMode);
    setEditorContent(initialContent ?? '');
    setCursorPosition(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const insertSnippet = useCallback(
    (type: SlideType) => {
      const snippet = snippets[type];
      if (!snippet) return;
      setEditorContent((prev) => {
        const before = prev.slice(0, cursorPosition);
        const after = prev.slice(cursorPosition);
        const separator = before.trim() ? '\n\n' : '';
        const inserted = separator + snippet + '\n';
        return before + inserted + after;
      });
    },
    [cursorPosition],
  );

  const loadExample = useCallback(() => {
    setEditorContent(exampleProposalMd);
    setCursorPosition(0);
  }, []);

  return {
    isOpen,
    open,
    close,
    mode,
    editorContent,
    setEditorContent,
    insertSnippet,
    loadExample,
    cursorPosition,
    setCursorPosition,
  };
}
