import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { registerOnlineSync, fullSync, isOnline } from '../lib/sync';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await fullSync();
      setLastSync(new Date());
      setPendingCount(0);
      return result;
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const onOnline = () => { setOnline(true); handleSync(); };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const cleanup = registerOnlineSync(() => setLastSync(new Date()));

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      cleanup();
    };
  }, [handleSync]);

  return (
    <OfflineContext.Provider value={{ online, syncing, lastSync, pendingCount, setPendingCount, manualSync: handleSync }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
