"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/db";

export interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

export default function TaskModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: Task | null;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
}) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    if (initial) {
      setDraft({
        title: initial.title,
        description: initial.description,
        status: initial.status,
        priority: initial.priority,
        dueDate: initial.dueDate || "",
      });
    } else {
      setDraft({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
    }
  }, [initial, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative card w-full max-w-lg p-6 animate-slide-up"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit task" : "New task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              autoFocus
              className="input"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              className="input resize-none h-24"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Add details…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select
                className="input"
                value={draft.status}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as TaskStatus })
                }
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select
                className="input"
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as any })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Due date</label>
            <input
              type="date"
              className="input"
              value={draft.dueDate || ""}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {initial ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}