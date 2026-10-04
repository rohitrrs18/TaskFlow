import { db, Task, SyncLog, getDeviceId } from "./db";
import { mergeTasks } from "./crdt";

const LATENCY_MS = 200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

// ----- Real API calls -----
async function apiGetTasks(): Promise<Task[] | null> {
  try {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.tasks as Task[];
  } catch {
    return null;
  }
}

async function apiPushTasks(tasks: Task[]): Promise<boolean> {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tasks),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ----- Public API -----
export async function pushPendingTasks() {
  if (!isOnline()) return { pushed: 0, conflicts: 0 };

  const deviceId = getDeviceId();
  const pending = await db.tasks.filter((t) => t.syncState === "pending").toArray();
  if (pending.length === 0) return { pushed: 0, conflicts: 0 };

  await sleep(LATENCY_MS);

  const ok = await apiPushTasks(pending);
  if (!ok) return { pushed: 0, conflicts: 0 };

  for (const local of pending) {
    await db.tasks.update(local.id, { syncState: "synced" });
    await log(local.id, "update", deviceId, "Pushed to Supabase");
  }
  return { pushed: pending.length, conflicts: 0 };
}

export async function pullRemoteTasks(): Promise<{ pulled: number }> {
  if (!isOnline()) return { pulled: 0 };
  await sleep(LATENCY_MS);

  const remoteTasks = await apiGetTasks();
  if (!remoteTasks) return { pulled: 0 };

  let pulled = 0;
  for (const remoteTask of remoteTasks) {
    const local = await db.tasks.get(remoteTask.id);
    if (!local) {
      await db.tasks.put({ ...remoteTask, syncState: "synced" });
      pulled++;
      continue;
    }
    if (local.syncState === "pending") continue;
    if (remoteTask.clock > local.clock) {
      await db.tasks.put({ ...remoteTask, syncState: "synced" });
      pulled++;
    }
  }
  return { pulled };
}

async function log(taskId: string, action: SyncLog["action"], deviceId: string, detail?: string) {
  await db.syncLog.add({ taskId, action, at: Date.now(), deviceId, detail });
}

export async function simulateRemoteEdit(taskId: string) {
  // Not used with Supabase — two tabs will now genuinely conflict
  console.warn("simulateRemoteEdit is a no-op when Supabase is enabled");
}

export async function runFullSync() {
  if (!isOnline()) return { pulled: 0, pushed: 0, conflicts: 0 };
  const pullResult = await pullRemoteTasks();
  const pushResult = await pushPendingTasks();
  return {
    pulled: pullResult.pulled,
    pushed: pushResult.pushed,
    conflicts: pushResult.conflicts,
  };
}