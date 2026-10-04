"use client";
import { useEffect, useRef, useState } from "react";
import { db, Task } from "./db";
import { runFullSync } from "./sync";
import { useOnlineStatus } from "./useOnlineStatus";

export interface SyncState {
  online: boolean;
  syncing: boolean;
  lastSyncAt?: number;
  lastResult?: { pulled: number; pushed: number; conflicts: number };
  pendingCount: number;
}

export function useSyncEngine() {
  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number>();
  const [lastResult, setLastResult] = useState<SyncState["lastResult"]>();
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  // Poll pending count every 1.5s (works, no Dexie hook API needed)
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      try {
        const n = await db.tasks.filter((t) => t.syncState === "pending").count();
        if (!cancelled) setPendingCount(n);
      } catch {
        /* db may be mid-migration */
      }
    };
    update();
    const interval = setInterval(update, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Sync on transition offline → online
  useEffect(() => {
    if (!online) return;
    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Background sync every 15s while online
  useEffect(() => {
    if (!online) return;
    const interval = setInterval(() => doSync(), 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Manual trigger from SW background sync message
  useEffect(() => {
    const handler = () => doSync();
    window.addEventListener("app:sync-now", handler);
    return () => window.removeEventListener("app:sync-now", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSync() {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await runFullSync();
      setLastResult(result);
      setLastSyncAt(Date.now());
    } catch (e) {
      console.warn("Sync failed", e);
    } finally {
      setSyncing(false);
      syncingRef.current = false;
    }
  }

  return {
    state: { online, syncing, lastSyncAt, lastResult, pendingCount },
    syncNow: doSync,
  };
}

export type { Task };