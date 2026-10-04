"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { db, Task } from "@/lib/db";

/**
 * Shows tasks currently in "conflict" state and lets the user
 * choose which version to keep. (Auto-merge already happened;
 * this is a UX safety net for the genuinely ambiguous cases.)
 */
export default function ConflictResolver() {
  const [conflicts, setConflicts] = useState<Task[]>([]);

  useEffect(() => {
    const load = async () => {
      const list = await db.tasks.filter((t) => t.syncState === "conflict").toArray();
      setConflicts(list);
    };
    load();
    const interval = setInterval(load, 1500);
    return () => clearInterval(interval);
  }, []);

  if (conflicts.length === 0) return null;

  const accept = async (id: string) => {
    await db.tasks.update(id, { syncState: "pending" });
    setConflicts((c) => c.filter((x) => x.id !== id));
  };

  return (
    <div className="card p-4 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-300">
          {conflicts.length} task{conflicts.length > 1 ? "s" : ""} need your attention
        </h3>
      </div>
      <ul className="space-y-2">
        {conflicts.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border"
          >
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{t.title}</div>
              <div className="text-xs text-slate-500">
                Merged from multiple devices. Review and confirm.
              </div>
            </div>
            <button
              onClick={() => accept(t.id)}
              className="btn-primary !px-3 !py-1.5 text-xs shrink-0"
            >
              <Check size={12} /> Accept
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}