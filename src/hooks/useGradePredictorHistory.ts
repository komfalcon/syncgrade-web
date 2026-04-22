import { useCallback, useEffect, useState } from 'react';
import { appDb, type PredictorHistoryEntry } from '@/storage/db';

export function useGradePredictorHistory() {
  const [history, setHistory] = useState<PredictorHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    const entries = await appDb.predictorHistory.orderBy('savedAt').reverse().toArray();
    setHistory(entries);
    setIsLoadingHistory(false);
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const saveHistoryEntry = useCallback(
    async (entry: Omit<PredictorHistoryEntry, 'id' | 'savedAt'>) => {
      const id = await appDb.predictorHistory.add({
        ...entry,
        savedAt: Date.now(),
      });
      await loadHistory();
      return id;
    },
    [loadHistory],
  );

  const deleteHistoryEntry = useCallback(
    async (id: number) => {
      await appDb.predictorHistory.delete(id);
      await loadHistory();
    },
    [loadHistory],
  );

  const clearHistory = useCallback(async () => {
    await appDb.predictorHistory.clear();
    await loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoadingHistory,
    saveHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
    reloadHistory: loadHistory,
  };
}
