"use client";
import { ClipboardList, Plus } from "lucide-react";

export default function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-12 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mx-auto mb-4">
        <ClipboardList size={28} className="text-brand-500" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No tasks yet</h3>
      <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">
        Create your first task. It will save locally and sync automatically
        when you're online.
      </p>
      <button onClick={onCreate} className="btn-primary">
        <Plus size={16} /> Create your first task
      </button>
    </div>
  );
}