'use client';

import * as React from 'react';
import { LiveBackground } from '@/components/layout/live-background';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useProgressStore } from '@/lib/stores/progress-store';
import { syncProgressToFirestore, loadProgressFromFirestore } from '@/lib/firestore-sync';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const bgIntensity = useSettingsStore((s) => s.bgIntensity ?? 0.7);
  const userEmail = useSettingsStore((s) => s.userEmail);
  const progress = useProgressStore();

  // Initial cloud restore on mount if userEmail is set
  const initialRestoreDone = React.useRef(false);
  React.useEffect(() => {
    if (!userEmail || !userEmail.includes('@') || initialRestoreDone.current) return;
    initialRestoreDone.current = true;

    loadProgressFromFirestore(userEmail)
      .then((cloudData) => {
        if (cloudData) {
          progress.mergeState(cloudData);
        }
      })
      .catch((err) => {
        console.warn('Auto cloud restore skipped:', err);
      });
  }, [userEmail, progress]);

  // Direct store subscription for instantaneous, robust auto-sync to Firestore
  React.useEffect(() => {
    if (!userEmail || !userEmail.includes('@')) return;

    let syncTimeout: any;
    const unsubscribe = useProgressStore.subscribe((state) => {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        const currentEmail = useSettingsStore.getState().userEmail;
        if (currentEmail && currentEmail.includes('@')) {
          syncProgressToFirestore(currentEmail, state).catch((err) => {
            console.warn('Auto-sync failed:', err);
          });
        }
      }, 600);
    });

    return () => {
      clearTimeout(syncTimeout);
      unsubscribe();
    };
  }, [userEmail]);

  return (
    <>
      <LiveBackground intensity={bgIntensity} />
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>
        {children}
      </div>
    </>
  );
}
