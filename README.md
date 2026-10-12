# Collaborative Code Editor

A real-time collaborative code editor for the browser. Teams create rooms, invite people with roles, and edit code files together. Edits merge conflict-free through a custom **CRDT** that runs in the client and syncs over **WebSocket (STOMP)**.

This repository is the **frontend** (React + Vite). It talks to a separate backend over REST and WebSocket.

---

## Features

- **Real-time co-editing**: multiple people type in the same file at once and everyone converges to the same text, with no locks and no overwrites.
- **Custom CRDT engine**: character-level sequence CRDT with tombstones, Lamport clocks and out-of-order operation buffering (see [How the CRDT works](#how-the-crdt-works)).
- **Monaco editor**: the VS Code editor core, with syntax highlighting for Java, JavaScript, TypeScript, Python and C++.
- **Rooms and roles**: each room has an **Owner**, **Editors** and **Viewers**. Viewers get a read-only editor.
- **Two ways to join a room**: share an invite code (the owner approves the request), or the owner invites a user directly by email with a chosen role.
- **Join requests and invitations**: a dedicated page to approve or reject requests and accept or decline invitations.
- **Notifications**: a bell in the navbar that polls the backend every 15 seconds.
- **Live presence**: see who is currently active in a document.
- **Checkpoints**: save snapshots of a document and restore any of them. Restoring resets the CRDT to the saved version for all collaborators.
- **Auth**: register and log in with email and password. A JWT is stored in `localStorage` and attached to every API request. Expired sessions are cleared automatically.
- **Resilient sync**: operations made while offline or before the initial sync are queued and flushed once the connection is ready. The socket reconnects automatically.

---

## Tech stack

| Area | Library |
| --- | --- |
| UI | React, React Router |
| Build tool | Vite |
| Styling | Tailwind CSS (v4) |
| Editor | `@monaco-editor/react` |
| Realtime | `@stomp/stompjs` over WebSocket |
| Sync algorithm | Custom CRDT (`src/crdt`) |

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- A running instance of the backend (see [Backend](#backend))

### Install and run

```bash
# install dependencies
npm install

# start the dev server
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

### Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the REST API | `https://collaborative-code-editor-3bfh.onrender.com` |

Create a `.env` file in the project root to override it:

```env
VITE_API_URL=http://localhost:8080
```

> **Note:** the WebSocket URL is currently hardcoded in `src/services/websocketService.js` (`brokerURL`). If you run the backend locally, update it there too (for example `ws://localhost:8080/ws`).

---

## Project structure

```
src/
├── main.jsx                  # App entry point
├── App.jsx                   # Routes and auth gating
├── index.css                 # Tailwind import and base styles
├── crdt/
│   ├── CRDTDocument.js       # Core CRDT: insert, delete, merge, ordering
│   ├── CRDTElement.js        # A single character node
│   └── CRDTOperation.js      # INSERT / DELETE operation wrapper
├── services/
│   ├── api.js                # fetch wrapper (auth header, 401 handling)
│   ├── Http.js               # JSON helpers and error messages
│   ├── authService.js        # register / login / session helpers
│   ├── websocketService.js   # STOMP connection, sync, presence, op queue
│   └── Roles.js              # Role labels, badges, date formatting
├── pages/
│   ├── LandingPage.jsx       # Public marketing page
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── RoomsPage.jsx         # Your rooms; create or join with a code
│   ├── RoomPage.jsx          # Room documents, members, invitations
│   ├── RequestsPage.jsx      # Join requests and invitations
│   └── EditorPage.jsx        # The collaborative editor
└── components/
    ├── common/               # AppNavbar, Modal, NotificationBell, UserMenu
    ├── editor/               # CodeEditor (Monaco), EditorTopBar
    └── layout/               # SideBar (checkpoints), TopBar, BottomBar
```

### Routes

| Path | Access | Page |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login`, `/register` | Public (redirects to `/rooms` if signed in) | Auth |
| `/rooms` | Signed in | Your rooms |
| `/rooms/:roomId` | Signed in | Room details |
| `/requests` | Signed in | Join requests and invitations |
| `/editor/:documentId` | Signed in | Editor |

---

## Roles

| Role | Can do |
| --- | --- |
| **Owner** | Everything: create documents, invite by email, approve requests, remove members, edit |
| **Editor** (`MEMBER`) | Edit documents |
| **Viewer** | Read-only access |

---

## How the CRDT works

The document is modelled as a tree of characters. Each character is a `CRDTElement`:

| Field | Meaning |
| --- | --- |
| `id` | Globally unique, `clientId:counter` |
| `afterId` | The character this one was inserted after (its parent) |
| `clock` | Lamport clock value at creation |
| `clientId` | The author, used to break ties |
| `deleted` | Tombstone flag; deleted characters stay in the structure so concurrent edits still resolve |

**Ordering.** Children of the same parent are sorted by clock (newest first), then `clientId`, then `id`. A depth-first walk of the tree gives the final text, so every client that has seen the same operations produces the same string.

**Out-of-order delivery.** An `INSERT` whose parent has not arrived yet waits in a pending buffer and is applied as soon as the parent shows up. A `DELETE` that arrives before its `INSERT` is remembered and applied when the character arrives. Duplicate operations are ignored.

**Baselines.** A document loads from the server as plain text, which becomes a baseline of elements with clock `0`. Each baseline has a `baselineVersion`; operations carry it so a client can ignore operations from an older baseline. Restoring a checkpoint produces a new baseline and every client resets from it.

### Sync flow

1. The client opens a STOMP connection to `/ws` with the JWT and a per-tab `clientId`.
2. It subscribes to three topics:
   - `/topic/document/{id}` for operations
   - `/topic/document/{id}/sync/{clientId}` for the initial state
   - `/topic/document/{id}/presence` for who is online
3. It publishes a `JOIN` presence message and asks for a sync at `/app/document/sync`, retrying up to 6 times at 1.5 s intervals.
4. Local edits are sent to `/app/document`. Until the first sync completes they are queued, then flushed in order.

---

## Backend

This repo contains only the client. It expects a backend that provides:

**REST**

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | Authentication (returns a JWT) |
| `GET/POST /api/rooms`, `GET /api/rooms/my` | List and create rooms |
| `POST /api/rooms/join` | Request to join with an invite code |
| `GET /api/rooms/my/requests`, `/api/rooms/{id}/requests` | Join requests |
| `PUT /api/rooms/requests/{membershipId}` | Approve or reject a request |
| `POST /api/rooms/{id}/invitations` | Invite a user by email |
| `GET /api/rooms/invitations/my`, `/api/rooms/invitations/{id}/{action}` | View and answer invitations |
| `GET /api/rooms/{id}/members`, `DELETE /api/rooms/{id}/members/{userId}` | Members |
| `GET /api/documents/room/{roomId}`, `POST /api/documents`, `GET /api/documents/{id}` | Documents |
| `GET/POST /api/documents/{id}/snapshots`, `POST .../snapshots/{id}/restore` | Checkpoints |
| `GET /api/notifications`, `PUT /api/notifications/{id}/read` | Notifications |

**WebSocket (STOMP)**: endpoint `/ws`, application prefix `/app`, broker prefix `/topic`.

The default `VITE_API_URL` points at a hosted instance on Render. Free instances sleep when idle, so the first request after a while can take a minute.

> This table is derived from the client code. Request and response payloads are defined by the backend, which is not part of this repo.

---

## Roadmap ideas

- Remote cursors and selections
- Code execution and output panel
- Per-document chat
- Offline persistence of pending operations
- Move the WebSocket URL into an environment variable

---
