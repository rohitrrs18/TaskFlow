import { Task } from "./db";

/**
 * Merge two versions of a task using Last-Write-Wins per field,
 * plus a monotonic clock to detect genuine conflicts.
 */
export interface MergeResult {
  merged: Task;
  conflictFields: string[];
}

const SYNCED_FIELDS: (keyof Task)[] = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
];

// Small helper so TS can safely assign dynamic-key writes
function setField<K extends keyof Task>(obj: Task, key: K, value: Task[K]): void {
  obj[key] = value;
}

export function mergeTasks(local: Task, remote: Task): MergeResult {
  const merged: Task = { ...local, fieldVersions: { ...local.fieldVersions } };
  const conflictFields: string[] = [];

  for (const field of SYNCED_FIELDS) {
    const lv = local.fieldVersions[field as string] ?? 0;
    const rv = remote.fieldVersions[field as string] ?? 0;
    const lval = local[field];
    const rval = remote[field];

    if (lval === rval) continue;

    if (lv === rv && lval !== rval) {
      // Both edited at same clock → genuine conflict
      conflictFields.push(field as string);
      // Tie-break deterministically by deviceId
      const winner = local.deviceId > remote.deviceId ? lval : rval;
      setField(merged, field, winner);
      merged.fieldVersions[field as string] = Math.max(lv, rv) + 1;
    } else if (lv > rv) {
      // Local newer → keep local (already copied, but ensure)
      setField(merged, field, lval);
    } else {
      // Remote newer → take remote
      setField(merged, field, rval);
      merged.fieldVersions[field as string] = rv;
    }
  }

  merged.updatedAt = Math.max(local.updatedAt, remote.updatedAt);
  merged.clock = Math.max(local.clock, remote.clock) + 1;
  merged.syncState = conflictFields.length > 0 ? "conflict" : "synced";

  return { merged, conflictFields };
}