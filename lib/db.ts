import Dexie, { Table } from "dexie";

export type TaskStatus = "todo" | "in-progress" | "done";
export type SyncState = "synced" | "pending" | "conflict";

export interface Task {
  id: string;              // UUID
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dueDate?: string;        // ISO date
  createdAt: number;       // ms epoch
  updatedAt: number;       // ms epoch
  deletedAt?: number;      // soft delete
  // Sync metadata
  syncState: SyncState;
  // CRDT: last-write-wins per field
  fieldVersions: Record<string, number>; // field -> updatedAt
  // Vector clock for conflict detection
  clock: number;
  deviceId: string;
}

export interface SyncLog {
  id?: number;
  taskId: string;
  action: "create" | "update" | "delete" | "conflict-resolved";
  at: number;
  deviceId: string;
  detail?: string;
}

class TaskFlowDB extends Dexie {
  tasks!: Table<Task, string>;
  syncLog!: Table<SyncLog, number>;

  constructor() {
    super("taskflow");
    this.version(1).stores({
      tasks: "id, status, updatedAt, syncState, deletedAt",
      syncLog: "++id, taskId, at, action",
    });
  }
}

export const db = new TaskFlowDB();

// Device identity — persists per browser
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("taskflow-device-id");
  if (!id) {
    id = "dev-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("taskflow-device-id", id);
  }
  return id;
}

// UUID v4 without external dep
export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}