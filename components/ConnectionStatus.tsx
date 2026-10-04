"use client";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { SyncState } from "@/lib/useSyncEngine";

export default function ConnectionStatus({
  state,
  onSync,
}: {
  state: SyncState;
  onSync: () => void;
}) {
  const { online, syncing, lastSyncAt, pendingCount, lastResult } = state;

  const label = !online
    ? "Offline"
    : syncing
    ? "Syncing…"
    : pendingCount > 0
    ? `${pendingCount} pending`
    : "All synced";

  const color = !online
    ? "text-red-500 bg-red-100 dark:bg-red-900/30"
    : syncing
    ? "text-brand-500 bg-brand-100 dark:bg-brand-900/30"
    : pendingCount > 0
    ? "text-amber-500 bg-amber-100 dark:bg-amber-900/30"
    : "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";

  const Icon = !online ? WifiOff : syncing ? RefreshCw : pendingCount > 0 ? AlertTriangle : CheckCircle2;

  return (
    <button
      onClick={onSync}
      disabled={!online || syncing}
      className={`badge ${color} hover:opacity-90 transition-all disabled:cursor-default`}
      title={
        lastSyncAt
          ? `Last sync: ${new Date(lastSyncAt).toLocaleTimeString()}`
          : "Never synced"
      }
    >
      <Icon size={12} className={syncing ? "animate-spin" : ""} />
      {label}
      {online && !syncing && <Wifi size={12} className="opacity-60" />}
    </button>
  );
}