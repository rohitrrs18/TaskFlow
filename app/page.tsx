"use client";
import { useMemo, useState } from "react";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";

import ThemeToggle from "@/components/ThemeToggle";
import ConnectionStatus from "@/components/ConnectionStatus";
import TaskCard from "@/components/TaskCard";
import TaskModal, { TaskDraft } from "@/components/TaskModal";
import SyncPanel from "@/components/SyncPanel";
import ConflictResolver from "@/components/ConflictResolver";
import EmptyState from "@/components/EmptyState";

import { db, uuid, getDeviceId, Task, TaskStatus } from "@/lib/db";
import { useSyncEngine } from "@/lib/useSyncEngine";

type FilterKey = "all" | TaskStatus;
type SortKey = "updated" | "created" | "priority" | "due";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function Home() {
  const { state, syncNow } = useSyncEngine();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("updated");

  const allTasks = useLiveQuery(
    () => db.tasks.filter((t) => !t.deletedAt).toArray(),
    []
  );

  const tasks = useMemo(() => {
    if (!allTasks) return [];
    let list = allTasks;

    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "created":
          return b.createdAt - a.createdAt;
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "due":
          return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return list;
  }, [allTasks, filter, query, sort]);

  const counts = useMemo(() => {
    const c = { all: 0, todo: 0, "in-progress": 0, done: 0 };
    allTasks?.forEach((t) => {
      c.all++;
      c[t.status]++;
    });
    return c;
  }, [allTasks]);

  // --- CRUD (all local-first, then queued for sync) ---

  const createTask = async (draft: TaskDraft) => {
    const now = Date.now();
    const deviceId = getDeviceId();
    const id = uuid();
    const task: Task = {
      id,
      title: draft.title,
      description: draft.description,
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || undefined,
      createdAt: now,
      updatedAt: now,
      syncState: "pending",
      fieldVersions: {
        title: now,
        description: now,
        status: now,
        priority: now,
        dueDate: now,
      },
      clock: 1,
      deviceId,
    };
    await db.tasks.add(task);
    setModalOpen(false);
    setEditing(null);
    // Try to push immediately if online
    if (state.online) syncNow();
  };

  const updateTask = async (id: string, draft: TaskDraft) => {
    const now = Date.now();
    const prev = await db.tasks.get(id);
    if (!prev) return;
    const versions = { ...prev.fieldVersions };
    (Object.keys(draft) as (keyof TaskDraft)[]).forEach((k) => {
      if (prev[k as keyof Task] !== draft[k]) versions[k as string] = now;
    });

    await db.tasks.update(id, {
      ...draft,
      dueDate: draft.dueDate || undefined,
      updatedAt: now,
      syncState: "pending",
      fieldVersions: versions,
      clock: prev.clock + 1,
    });
    setModalOpen(false);
    setEditing(null);
    if (state.online) syncNow();
  };

  const deleteTask = async (id: string) => {
    const now = Date.now();
    await db.tasks.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncState: "pending",
      clock: (await db.tasks.get(id))!.clock + 1,
    });
    if (state.online) syncNow();
  };

  const toggleStatus = async (t: Task) => {
    const next: TaskStatus =
      t.status === "todo" ? "in-progress" : t.status === "in-progress" ? "done" : "todo";
    const now = Date.now();
    await db.tasks.update(t.id, {
      status: next,
      updatedAt: now,
      syncState: "pending",
      fieldVersions: { ...t.fieldVersions, status: now },
      clock: t.clock + 1,
    });
    if (state.online) syncNow();
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-[rgb(var(--bg))]/80 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
              T
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold leading-tight">TaskFlow</h1>
              <p className="text-xs text-slate-500">Offline-first workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ConnectionStatus state={state} onSync={syncNow} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero */}
        <section className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1.5">
            Your tasks,{" "}
            <span className="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
              online or off
            </span>
          </h2>
          <p className="text-sm text-slate-500">
            Everything saves locally first. Sync happens automatically — no data lost, ever.
          </p>
        </section>

        {/* Sync Panel */}
        <SyncPanel state={state} onSync={syncNow} />

        {/* Conflicts */}
        <ConflictResolver />

        {/* Controls */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
           <input
  className="input !pl-9"
  placeholder="Search tasks…"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
          </div>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
              className="input !w-auto"
            >
              <option value="all">All ({counts.all})</option>
              <option value="todo">To do ({counts.todo})</option>
              <option value="in-progress">In progress ({counts["in-progress"]})</option>
              <option value="done">Done ({counts.done})</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input !w-auto"
            >
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="priority">By priority</option>
              <option value="due">By due date</option>
            </select>

            <button
              className="btn-primary whitespace-nowrap"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New task</span>
            </button>
          </div>
        </section>

        {/* Task list */}
        <section>
          {!allTasks ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-4 h-32 skeleton" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            allTasks.length === 0 ? (
              <EmptyState
                onCreate={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              />
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                No tasks match your filters.
              </div>
            )
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {tasks.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskCard
                      task={t}
                      onEdit={() => {
                        setEditing(t);
                        setModalOpen(true);
                      }}
                      onDelete={() => deleteTask(t.id)}
                      onToggleStatus={() => toggleStatus(t)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      <TaskModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={(draft) => (editing ? updateTask(editing.id, draft) : createTask(draft))}
      />

      <footer className="text-center text-xs text-slate-500 py-8">
        Offline-first PWA · Developed by RS 
      </footer>
    </main>
  );
}