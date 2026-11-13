import { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { StoredBudgetData } from '../utils/storage';

export interface HistoryEntry {
  state: StoredBudgetData;
  label: string;
  coalesceKey?: string;
}

export interface BudgetHistoryState {
  past: HistoryEntry[];
  present: StoredBudgetData;
  future: HistoryEntry[];
  lastCoalesceKey: string | null;
  revision: number;
}

const MAX_HISTORY = 100;

export const HistoryRevisionContext = createContext<number>(0);

export function useHistoryRevision(): number {
  return useContext(HistoryRevisionContext);
}

export function useBudgetHistory(initialDataOrFactory: StoredBudgetData | (() => StoredBudgetData)) {
  const [history, setHistory] = useState<BudgetHistoryState>(() => {
    const initial =
      typeof initialDataOrFactory === 'function'
        ? initialDataOrFactory()
        : initialDataOrFactory;
    return {
      past: [],
      present: initial,
      future: [],
      lastCoalesceKey: null,
      revision: 0,
    };
  });

  // Keep a synchronous ref mirror so rapid keyboard shortcuts or callbacks read current labels accurately
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const commitChange = useCallback(
    (
      updater: (prev: StoredBudgetData) => StoredBudgetData,
      label: string,
      coalesceKey?: string
    ) => {
      setHistory((prev) => {
        const nextState = updater(prev.present);

        if (JSON.stringify(nextState) === JSON.stringify(prev.present)) {
          return prev;
        }

        if (coalesceKey && prev.lastCoalesceKey === coalesceKey && prev.past.length > 0) {
          const topEntry = prev.past[prev.past.length - 1];
          // If the edit session reverted back to the exact pre-session state, drop the redundant entry
          if (JSON.stringify(nextState) === JSON.stringify(topEntry.state)) {
            const nextHistory: BudgetHistoryState = {
              past: prev.past.slice(0, -1),
              present: nextState,
              future: [],
              lastCoalesceKey: null,
              revision: prev.revision,
            };
            historyRef.current = nextHistory;
            return nextHistory;
          }

          const nextHistory: BudgetHistoryState = {
            ...prev,
            present: nextState,
            future: [],
          };
          historyRef.current = nextHistory;
          return nextHistory;
        }

        const newPast = [...prev.past, { state: prev.present, label, coalesceKey }];
        if (newPast.length > MAX_HISTORY) {
          newPast.shift();
        }

        const nextHistory: BudgetHistoryState = {
          past: newPast,
          present: nextState,
          future: [],
          lastCoalesceKey: coalesceKey ?? null,
          revision: prev.revision,
        };
        historyRef.current = nextHistory;
        return nextHistory;
      });
    },
    []
  );

  const undo = useCallback((): string | null => {
    const current = historyRef.current;
    if (current.past.length === 0) return null;

    const undoneLabel = current.past[current.past.length - 1].label;

    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      const nextFuture = [{ state: prev.present, label: previous.label }, ...prev.future].slice(
        0,
        MAX_HISTORY
      );

      const nextHistory: BudgetHistoryState = {
        past: newPast,
        present: previous.state,
        future: nextFuture,
        lastCoalesceKey: null,
        revision: prev.revision + 1,
      };
      historyRef.current = nextHistory;
      return nextHistory;
    });

    return undoneLabel;
  }, []);

  const redo = useCallback((): string | null => {
    const current = historyRef.current;
    if (current.future.length === 0) return null;

    const redoneLabel = current.future[0].label;

    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      const newPast = [...prev.past, { state: prev.present, label: next.label }];
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }

      const nextHistory: BudgetHistoryState = {
        past: newPast,
        present: next.state,
        future: newFuture,
        lastCoalesceKey: null,
        revision: prev.revision + 1,
      };
      historyRef.current = nextHistory;
      return nextHistory;
    });

    return redoneLabel;
  }, []);

  return {
    data: history.present,
    historyRevision: history.revision,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undoLabel: history.past.length > 0 ? history.past[history.past.length - 1].label : null,
    redoLabel: history.future.length > 0 ? history.future[0].label : null,
    commitChange,
    undo,
    redo,
  };
}
