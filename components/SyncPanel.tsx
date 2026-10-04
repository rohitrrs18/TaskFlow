"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  CloudOff,
  ChevronDown,
  Zap,
  Radio,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { broadcastRemoteEdit, getRemoteDeviceId } from "@/lib/devices";
import type { SyncState } from "@/lib/useSyncEngine";

export default function SyncPanel({
  state,
  onSync,
}: {
  state: SyncState;
  onSync: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const logs = useLiveQuery(
    () => db.syncLog.orderBy("at").reverse().limit(20).toArray(),
    []
  );

  const { online, syncing, lastSyncAt, lastResult, pendingCount } = state;

  const openSecondTab = () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const simulateRemoteEdit = async () => {
    const allTasks = await db.tasks.toArray();
    if (allTasks.length === 0) {
      alert("Create a task first, then simulate a remote edit.");
      return;
    }
    // Prefer a task that's NOT pending, so the conflict is real
    const target =
      allTasks.find((t) => t.syncState !== "pending") || allTasks[0];

    const titles = [
      "Review PR (edited on other device)",
      "Write docs (edited remotely)",
      "Fix bug (remote change)",
      "Refactor auth (from phone)",
      "Add tests (from laptop)",
    ];
    const newTitle = titles[Math.floor(Math.random() * titles.length)];

    broadcastRemoteEdit({
      ...target,
      title: newTitle,
    });

    // Trigger a sync so this tab pulls the remote change
    setTimeout(onSync, 300);
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              online
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
            }`}
          >
            {online ? <Cloud size={18} /> : <CloudOff size={18} />}
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm">
              {online ? "Connected" : "Offline mode"}
            </div>
            <div className="text-xs text-slate-500">
              {lastSyncAt
                ? `Last sync ${new Date(lastSyncAt).toLocaleTimeString()}`
                : "Never synced"}
              {pendingCount > 0 && ` · ${pendingCount} pending`}
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t"
          >
            <div className="p-4 space-y-3">
              {/* Primary actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSync}
                  disabled={!online || syncing}
                  className="btn-primary !py-2 text-sm disabled:opacity-50"
                >
                  <RotateCcw size={14} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Syncing…" : "Sync now"}
                </button>
                <button
                  onClick={simulateRemoteEdit}
                  className="btn-ghost !py-2 text-sm"
                  title="Simulates another device editing a task"
                >
                  <Radio size={14} /> Simulate remote edit
                </button>
              </div>

              {/* Second-tab helper */}
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <ExternalLink size={12} />
                  Test real conflict between two tabs
                </div>
                <div className="text-slate-500 leading-relaxed">
                  Open a second tab of this app. Both tabs act as
                  separate devices. Edit the same task offline in each —
                  on reconnect, the conflict resolver will show up.
                </div>
                <div className="flex gap-2">
                  <button onClick={openSecondTab} className="btn-ghost !py-1.5 !px-3 text-xs">
                    <ExternalLink size={12} /> Open 2nd device
                  </button>
                  <button onClick={copyUrl} className="btn-ghost !py-1.5 !px-3 text-xs">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy URL"}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  This tab: <code>{getRemoteDeviceId()}</code>
                </div>
              </div>

              {lastResult && (
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="badge bg-slate-100 dark:bg-slate-800">
                    <Zap size={10} /> {lastResult.pushed} pushed
                  </span>
                  <span className="badge bg-slate-100 dark:bg-slate-800">
                    {lastResult.pulled} pulled
                  </span>
                  {lastResult.conflicts > 0 && (
                    <span className="badge bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {lastResult.conflicts} conflicts resolved
                    </span>
                  )}
                </div>
              )}

              {/* Log */}
              <div className="max-h-56 overflow-y-auto rounded-xl border bg-slate-50/50 dark:bg-slate-900/40">
                {!logs || logs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No sync activity yet.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {logs.map((l) => (
                      <li key={l.id} className="px-3 py-2 text-xs flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            l.action === "conflict-resolved"
                              ? "bg-amber-500"
                              : l.action === "create"
                              ? "bg-emerald-500"
                              : l.action === "delete"
                              ? "bg-red-500"
                              : "bg-brand-500"
                          }`}
                        />
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {new Date(l.at).toLocaleTimeString()}
                        </span>
                        <span className="text-slate-500 shrink-0">·</span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {l.detail || l.action}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}