import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export interface UndoRedoControls<T> {
  push: (state: T) => void;
  undo: () => T | null;
  redo: () => T | null;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export function useUndoRedo<T>(): UndoRedoControls<T> {
  const undoStack = useRef<T[]>([]);
  const redoStack = useRef<T[]>([]);
  const [stackState, setStackState] = useState({ canUndo: false, canRedo: false });
  const syncStackState = useCallback(() => {
    setStackState({
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    });
  }, []);

  const push = useCallback((state: T) => {
    undoStack.current.push(state);
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    syncStackState();
  }, [syncStackState]);

  const undo = useCallback((): T | null => {
    const state = undoStack.current.pop();
    if (state === undefined) return null;
    // The caller is responsible for pushing the current state onto redo
    syncStackState();
    return state;
  }, [syncStackState]);

  const redo = useCallback((): T | null => {
    const state = redoStack.current.pop();
    if (state === undefined) return null;
    syncStackState();
    return state;
  }, [syncStackState]);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    syncStackState();
  }, [syncStackState]);

  const pushToRedo = useCallback((state: T) => {
    redoStack.current.push(state);
    if (redoStack.current.length > MAX_HISTORY) {
      redoStack.current.shift();
    }
    syncStackState();
  }, [syncStackState]);

  return {
    push,
    undo,
    redo,
    canUndo: stackState.canUndo,
    canRedo: stackState.canRedo,
    clear,
    // Expose pushToRedo for the editor to use
    ...(({ pushToRedo }) as unknown as Record<string, never>),
  };
}

// Simpler approach: the editor manages undo/redo stacks directly via refs
// This avoids re-render issues with the hook approach

export interface UndoRedoSnapshot {
  slides: unknown; // SlideConfig[] - kept as unknown for serialization
  selectedSlideId: string | null;
}

export function createUndoRedoManager(maxHistory = 50) {
  const undoStack: UndoRedoSnapshot[] = [];
  const redoStack: UndoRedoSnapshot[] = [];

  return {
    push(snapshot: UndoRedoSnapshot) {
      undoStack.push(snapshot);
      if (undoStack.length > maxHistory) undoStack.shift();
      redoStack.length = 0;
    },

    undo(currentSnapshot: UndoRedoSnapshot): UndoRedoSnapshot | null {
      const previous = undoStack.pop();
      if (!previous) return null;
      redoStack.push(currentSnapshot);
      return previous;
    },

    redo(currentSnapshot: UndoRedoSnapshot): UndoRedoSnapshot | null {
      const next = redoStack.pop();
      if (!next) return null;
      undoStack.push(currentSnapshot);
      return next;
    },

    get canUndo() { return undoStack.length > 0; },
    get canRedo() { return redoStack.length > 0; },

    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
    },
  };
}
