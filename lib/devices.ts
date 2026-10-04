"use client";
/**
 * Cross-tab "device" simulation using BroadcastChannel.
 * Real-world equivalent: two browsers on two physical machines.
 */
import { db, Task, getDeviceId } from "./db";

const CHANNEL_NAME = "taskflow-devices";
const REMOTE_KEY = "taskflow-remote-store";

interface DeviceMessage {
  type: "remote-edit" | "request-snapshot";
  task?: Task;
  from: string;
}

let channel: BroadcastChannel | null = null;

export function getDeviceChannel(): BroadcastChannel {
  if (typeof window === "undefined") throw new Error("BroadcastChannel is browser-only");
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = handleMessage;
  }
  return channel;
}

function handleMessage(event: MessageEvent<DeviceMessage>) {
  const msg = event.data;
  if (msg.type === "remote-edit" && msg.task) {
    // Write the remote edit into our fake server store so it's visible on next pull
    const store = readRemote();
    store[msg.task.id] = msg.task;
    writeRemote(store);
  }
}

/**
 * Broadcast a remote edit from "another device" (another tab).
 * Writes to the shared localStorage remote store so all tabs see it.
 */
export function broadcastRemoteEdit(task: Task) {
  const edited: Task = {
    ...task,
    deviceId: getRemoteDeviceId(),
    updatedAt: Date.now(),
    clock: task.clock + 1,
    syncState: "synced",
    fieldVersions: { ...task.fieldVersions, title: Date.now() },
  };

  // Write to shared store
  const store = readRemote();
  store[edited.id] = edited;
  writeRemote(store);

  // Notify other tabs
  try {
    getDeviceChannel().postMessage({
      type: "remote-edit",
      task: edited,
      from: edited.deviceId,
    });
  } catch {
    /* channel may not be initialized */
  }
}

export function getRemoteDeviceId(): string {
  if (typeof window === "undefined") return "remote";
  let id = sessionStorage.getItem("taskflow-remote-device-id");
  if (!id) {
    id = "dev-" + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("taskflow-remote-device-id", id);
  }
  return id;
}

function readRemote(): Record<string, Task> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(REMOTE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeRemote(store: Record<string, Task>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMOTE_KEY, JSON.stringify(store));
}

/**
 * Task metadata to show "device" in UI. Not persisted to real DB.
 */
export function shortDeviceId(id: string): string {
  return id.slice(0, 8);
}