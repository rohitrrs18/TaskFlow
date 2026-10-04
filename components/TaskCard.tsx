"use client";
import { useState } from "react";
import { Trash2, Pencil, Clock, AlertTriangle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Task } from "@/lib/db";

const priorityStyles = {
  low: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  medium: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  high: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};

const statusIcons = {
  todo: Circle,
  "in-progress": Loader2,
  done: CheckCircle2,
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const StatusIcon = statusIcons[task.status];

  const isOverdue =
    task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();

  return (
    <div
      className={`card p-4 animate-slide-up transition-all hover:shadow-lg ${
        task.status === "done" ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleStatus}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-500 transition-colors"
          aria-label="Toggle status"
        >
          <StatusIcon
            size={20}
            className={task.status === "in-progress" ? "animate-spin text-brand-500" : ""}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-[15px] leading-snug ${
                task.status === "done" ? "line-through text-slate-500" : ""
              }`}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {task.syncState === "pending" && (
                <span className="badge bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  <Clock size={10} /> Pending
                </span>
              )}
              {task.syncState === "conflict" && (
                <span className="badge bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                  <AlertTriangle size={10} /> Conflict
                </span>
              )}
              {task.syncState === "synced" && (
                <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={10} /> Synced
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`badge ${priorityStyles[task.priority]}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span
                className={`badge ${
                  isOverdue
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
        <button onClick={onEdit} className="btn-ghost !px-3 !py-1.5 text-xs">
          <Pencil size={14} /> Edit
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onDelete}
              className="btn-danger !px-3 !py-1.5 text-xs"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-ghost !px-3 !py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-ghost !px-3 !py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}