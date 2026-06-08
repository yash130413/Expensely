import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useOffline } from '../context/OfflineContext';

export default function OfflineBanner() {
  const { online, syncing, lastSync, pendingCount, manualSync } = useOffline();

  if (online && !syncing && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all
      ${!online ? 'bg-gray-900 text-white' : 'bg-blue-600 text-white'}`}>
      
      {!online && (
        <>
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>You're offline — changes will sync when back online</span>
          {pendingCount > 0 && (
            <span className="bg-white text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </>
      )}

      {online && syncing && (
        <>
          <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
          <span>Syncing your data...</span>
        </>
      )}

      {online && !syncing && pendingCount > 0 && (
        <>
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{pendingCount} changes pending</span>
          <button
            onClick={manualSync}
            className="ml-1 underline text-blue-200 hover:text-white"
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
