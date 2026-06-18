import { useState, useEffect } from 'react';
import { getOfflineQueue, saveOfflineQueue, syncScoutData } from '../lib/offlineSync';
import { Language } from '../types';

export function useOfflineSync(language: Language) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updatePendingCount = () => {
    setPendingCount(getOfflineQueue().length);
  };

  const attemptSync = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    console.log(`Auto-Sync: Found ${queue.length} items in local queue. Attempting upload...`);

    const updatedQueue = [...queue];
    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        await syncScoutData(item);
        // Remove from our temporary array on success
        const idx = updatedQueue.findIndex((q) => q.sessionId === item.sessionId);
        if (idx >= 0) {
          updatedQueue.splice(idx, 1);
        }
        successCount++;
      } catch (e) {
        console.error(`Auto-Sync failed for session ${item.sessionId}:`, e);
        failCount++;
      }
    }

    saveOfflineQueue(updatedQueue);
    updatePendingCount();
    setIsSyncing(false);

    if (successCount > 0) {
      const message = language === Language.HE
        ? `סנכרון רקע הצליח: ${successCount} משחקים סונכרנו לשרת בהצלחה!`
        : `Background sync complete: ${successCount} matches successfully synchronized.`;
      
      alert(message);
    }
  };

  useEffect(() => {
    updatePendingCount();

    // Check on interval as a backup
    const interval = setInterval(() => {
      if (navigator.onLine) {
        attemptSync();
      } else {
        updatePendingCount();
      }
    }, 15000);

    const handleOnline = () => {
      console.log('Browser is back online! Triggering offline queue sync...');
      attemptSync();
    };

    window.addEventListener('online', handleOnline);

    // Initial check on mount if we are online
    if (navigator.onLine) {
      attemptSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [language]);

  return {
    pendingCount,
    isSyncing,
    forceSync: attemptSync,
  };
}
