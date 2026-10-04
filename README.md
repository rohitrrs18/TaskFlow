<div align="center">

<img src="docs/logo.png" alt="RS Logo" width="96" height="96" />

# TaskFlow — Offline-First Workspace

**By Rohit Sawant (RS)**

A production-quality, offline-first task management PWA. Create, edit, and delete
tasks even when the network is down. Changes queue locally and sync automatically
when connectivity returns. Conflicts between devices are detected and resolved —
never silently overwritten.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Dexie](https://img.shields.io/badge/Dexie-4-2C3E50?logo=indexeddb&logoColor=white)](https://dexie.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[Features](#-features) · [Screenshots](#-screenshots) · [Architecture](#-architecture) · [Setup](#-getting-started)

</div>

---

## 🎯 The Problem

Web applications become **unusable when connectivity is unstable**. A user on a
train, in a basement, or on a plane loses all ability to work. Modern web apps
assume the network is always available — but it isn't.

## 💡 The Solution

**TaskFlow** is a **true offline-first** application:

1. Every action writes to **local storage first** (IndexedDB)
2. The UI updates **instantly** — no network wait, ever
3. Changes are **queued** while offline with a visible pending state
4. When the network returns, queued changes **sync automatically**
5. **Conflicts** between devices are resolved via **CRDT merge logic** — never silently overwritten

The network becomes a **background detail**, not a blocker.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🚀 **True offline-first** | Loads, works, and persists entirely without a network |
| 🔄 **Automatic sync** | Queued changes drain the moment connectivity returns |
| ⏳ **Honest pending states** | Tasks created offline show an amber "Pending" badge |
| 🔀 **CRDT conflict resolution** | Field-level last-write-wins with a conflict UI |
| 🌗 **Dark/light theme** | Smooth transitions + system-preference detection |
| 📱 **Installable PWA** | Works as a standalone app on desktop and mobile |
| 🎨 **Polished UI** | Tailwind v4, Framer Motion animations, accessible |
| 🔒 **Zero external APIs** | No OpenAI, no Stripe, no auth providers — nothing |

---

## 📸 Screenshots

<div align="center">

### 1. Online — All Synced
<img src="docs/screenshot-online.png" alt="Online state" width="720" />

### 2. Offline Mode — Task Queued as Pending
<img src="docs/screenshot-offline.png" alt="Offline mode" width="720" />

### 3. Back Online — Auto-Synced
<img src="docs/screenshot-synced.png" alt="Synced state" width="720" />

</div>

---

## 🏗 Architecture

```mermaid
flowchart TB
    subgraph Browser["Browser (Client)"]
        UI[UI Components<br/>React + Next.js]
        Engine[Sync Engine<br/>useSyncEngine]
        Dexie[(Dexie / IndexedDB<br/>tasks + syncLog)]
        CRDT[CRDT Merger<br/>field-level LWW]
        SW[Service Worker<br/>cache shell + assets]
    end

    subgraph Remote["Remote Store (Simulated)"]
        Remote[(localStorage<br/>fake server)]
    end

    UI --> Engine
    UI --> Dexie
    Engine --> Dexie
    Engine --> CRDT
    Engine -->|online| Remote
    Engine -.->|offline<br/>no-op| Dexie
    SW --> UI

    style Engine fill:#3b66f5,color:#fff
    style CRDT fill:#a855f7,color:#fff
    style Remote fill:#10b981,color:#fff