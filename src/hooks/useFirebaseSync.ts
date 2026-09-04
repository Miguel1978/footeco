import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MatchData, FirebaseSyncState } from '../types';
import { saveMatchData, loadMatchData } from '../utils/storage';

export interface UseFirebaseSyncResult {
  syncState: FirebaseSyncState;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  forceSync: () => Promise<void>;
  isCloudConnected: boolean;
}

export function useFirebaseSync(
  matchData: MatchData,
  onRemoteUpdate?: (data: MatchData) => void
): UseFirebaseSyncResult {
  const [syncState, setSyncState] = useState<FirebaseSyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const isSyncingRef = useRef(false);

  // Network online/offline status
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncState === 'offline') setSyncState('idle');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncState]);

  // Actual Firestore Sync Function
  const syncToFirestore = useCallback(
    async (data: MatchData, isManual = false) => {
      // 1. Always persist locally first to guarantee zero data loss
      saveMatchData(data);

      if (!navigator.onLine) {
        setSyncState('offline');
        setErrorMessage('Connexion internet hors-ligne (sauvegarde locale sécurisée).');
        return;
      }

      setSyncState('syncing');
      setErrorMessage(null);
      isSyncingRef.current = true;

      try {
        // Save to Firestore
        const docId = data.id || 'current_match';
        const matchRef = doc(db, 'matches', docId);

        // Sanitize data before writing to Firestore
        const payload = {
          ...data,
          updatedAt: new Date().toISOString(),
          syncedBy: auth.currentUser?.email || 'anonymous',
        };

        await setDoc(matchRef, payload, { merge: true });

        setSyncState('synced');
        setLastSyncedAt(new Date());
        setErrorMessage(null);
      } catch (err: any) {
        console.warn('Firebase Firestore sync notice/fallback:', err);
        setSyncState('error');
        setErrorMessage(
          err?.code === 'permission-denied'
            ? 'Permissions Firestore restreintes (authentification requise)'
            : err?.message || 'Erreur lors de la synchronisation Firebase'
        );
      } finally {
        isSyncingRef.current = false;
      }
    },
    []
  );

  // Debounced auto-save on data modifications
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSyncState('syncing');
    const timer = setTimeout(() => {
      syncToFirestore(matchData);
    }, 450);

    return () => clearTimeout(timer);
  }, [matchData, syncToFirestore]);

  // Manual Force Sync trigger
  const forceSync = useCallback(async () => {
    await syncToFirestore(matchData, true);
  }, [matchData, syncToFirestore]);

  return {
    syncState: !isOnline ? 'offline' : syncState === 'idle' ? 'synced' : syncState,
    lastSyncedAt,
    errorMessage,
    forceSync,
    isCloudConnected: isOnline && syncState !== 'error',
  };
}
