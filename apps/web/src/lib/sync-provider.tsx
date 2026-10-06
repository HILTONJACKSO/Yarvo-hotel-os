'use client';

import { useEffect } from 'react';
import { syncOfflineMutations, downloadLatestData } from './sync';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online. Triggering sync...');
      syncOfflineMutations();
      downloadLatestData();
    };

    const handleOffline = () => {
      console.log('App is offline. Using local database.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      handleOnline();
    }

    // Polling every 5 minutes if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        downloadLatestData();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
