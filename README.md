# Collaborative Code Editor

A real-time collaborative code editor for the browser. Teams create rooms, invite people with roles, and edit code files together. Edits merge conflict-free through a custom **CRDT** and sync over **WebSocket (STOMP)**.

**Live demo:** https://collaborative-code-editor-frontend-re9s.onrender.com

> The demo runs on free hosting, so the first load after a period of inactivity can take up to a minute while the servers wake up.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Roles and permissions](#roles-and-permissions)
- [How the CRDT works](#how-the-crdt-works)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Features

- **Real-time co-editing**: several people type in the same file at once and everyone converges to the same text, with no locks and no overwrites.
- **Custom CRDT engine**: character-level sequence CRDT with tombstones, Lamport clocks and out-of-order operation buffering.
- **Monaco editor**: the VS Code editor core, with syntax highlighting for Java, JavaScript, TypeScript, Python and C++.
- **Rooms and roles**: each room has an Owner, Editors and Viewers. Viewers get a read-only editor.
- **Two ways to join**: share an invite code (the owner approves the request), or invite a user directly by email with a chosen role.
- **Join requests and invitations**: a dedicated page to approve or reject requests and accept or decline invitations.
- **Notifications**: a bell in the navbar that polls every 15 seconds.
- **Live presence**: see who is currently active in a document.
- **Checkpoints**: save snapshots of a document and restore any of them. Restoring resets the CRDT for all collaborators.
- **Authentication**: email and password sign-up and login with a JWT. Expired sessions are cleared automatically.
- **Resilient sync**: edits made before the initial sync completes are queued and flushed in order, and the socket reconnects automatically.

---

## Architecture

```
┌──────────────────────────┐        REST (JWT)         ┌──────────────────────┐
│  Frontend (React + Vite) │ ────────────────────────▶ │  Backend API         │
│                          │                           │  auth, rooms,        │
│  Monaco editor           │   WebSocket (STOMP, JWT)  │  documents,          │
│  CRDT engine (client)    │ ◀───────────────────────▶ │  snapshots,          │
│                          │   /app/* in, /topic/* out │  notifications       │
└──────────────────────────┘                           └──────────┬───────────┘
                                                                  │
                                                           ┌──────▼───────┐
                                                           │   Database   │
                                                           └──────────────┘
```

The CRDT lives in the client. Each browser tab applies its own edits locally, broadcasts them as operations, and merges operations from other collaborators. The backend authenticates users, enforces room roles, persists documents and checkpoints, and relays operations to everyone subscribed to a document.

---

## Tech stack

**Frontend**

| Area | Library |
| --- | --- |
| UI | React, React Router |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Editor | `@monaco-editor/react` |
| Realtime | `@stomp/stompjs` |
| Sync algorithm | Custom CRDT (`src/crdt`) |

**Backend**

| Area | Technology |
| --- | --- |
| Language / framework | Java, Spring Boot |
| Realtime | STOMP over WebSocket at `/ws` (app prefix `/app`, broker prefix `/topic`) |
| Auth | JWT bearer tokens |
| Database | PostgreSQL |

**Hosting:** Render (frontend and backend).

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- JDK 17 or newer
- PostgreSQL

### 1. Backend

Set the backend environment variables (see [Configuration](#configuration)) before starting it. By default the API is expected at `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

To point the frontend at a local backend, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

Then update the WebSocket URL in `src/services/websocketService.js`, which is currently hardcoded:

```js
brokerURL: "ws://localhost:8080/ws"
```

### Production build

```bash
cd frontend
npm run build
npm run preview
```

---

## Configuration

**Frontend**

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the REST API | `https://collaborative-code-editor-3bfh.onrender.com` |

**Backend**

| Variable | Description |
| --- | --- |
| `JWT_SECRET` | Secret used to sign tokens |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Database connection |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) allowed to call the API |

---

## Project structure

```
.
├── backend/                    # API and WebSocket server
└── frontend/
    └── src/
        ├── main.jsx            # Entry point
        ├── App.jsx             # Routes and auth gating
        ├── crdt/
        │   ├── CRDTDocument.js     # Insert, delete, merge, ordering
        │   ├── CRDTElement.js      # A single character node
        │   └── CRDTOperation.js    # INSERT / DELETE operation wrapper
        ├── services/
        │   ├── api.js              # fetch wrapper (auth header, 401 handling)
        │   ├── Http.js             # JSON helpers and error messages
        │   ├── authService.js      # register / login / session
        │   ├── websocketService.js # STOMP connection, sync, presence, op queue
        │   └── Roles.js            # Role labels, badges, date formatting
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx / RegisterPage.jsx
        │   ├── RoomsPage.jsx       # Your rooms; create or join with a code
        │   ├── RoomPage.jsx        # Documents, members, invitations
        │   ├── RequestsPage.jsx    # Join requests and invitations
        │   └── EditorPage.jsx      # The collaborative editor
        └── components/
            ├── common/             # AppNavbar, Modal, NotificationBell, UserMenu
            ├── editor/             # CodeEditor (Monaco), EditorTopBar
            └── layout/             # SideBar (checkpoints), TopBar, BottomBar
```

### Frontend routes

| Path | Access | Page |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login`, `/register` | Public (redirects to `/rooms` if signed in) | Auth |
| `/rooms` | Signed in | Your rooms |
| `/rooms/:roomId` | Signed in | Room details |
| `/requests` | Signed in | Join requests and invitations |
| `/editor/:documentId` | Signed in | Editor |

---

## Roles and permissions

| Role | Can do |
| --- | --- |
| **Owner** | Everything: create documents, invite by email, approve requests, remove members, edit |
| **Editor** (`MEMBER`) | Edit documents |
| **Viewer** | Read-only access |

---

## How the CRDT works

The document is a tree of characters. Each character is a `CRDTElement`:

| Field | Meaning |
| --- | --- |
| `id` | Globally unique, `clientId:counter` |
| `afterId` | The character this one was inserted after (its parent) |
| `clock` | Lamport clock value at creation |
| `clientId` | The author, used to break ties |
| `deleted` | Tombstone flag; deleted characters stay in the structure so concurrent edits still resolve |

**Ordering.** Children of the same parent are sorted by clock (newest first), then `clientId`, then `id`. A depth-first walk of the tree yields the final text, so every client that has seen the same operations produces the same string.

**Out-of-order delivery.** An `INSERT` whose parent has not arrived waits in a pending buffer and is applied once the parent shows up. A `DELETE` that arrives before its `INSERT` is remembered and applied when the character arrives. Duplicate operations are ignored.

**Baselines.** A document loads from the server as plain text, which becomes a baseline of elements with clock `0`. Each baseline has a `baselineVersion`, and operations carry it so stale operations from an older baseline can be ignored. Restoring a checkpoint creates a new baseline and every client resets from it.

### Sync flow

1. The client opens a STOMP connection to `/ws` with the JWT and a per-tab `clientId`.
2. It subscribes to:
   - `/topic/document/{id}` for operations
   - `/topic/document/{id}/sync/{clientId}` for the initial state
   - `/topic/document/{id}/presence` for who is online
3. It publishes a `JOIN` presence message and requests a sync at `/app/document/sync`, retrying up to 6 times at 1.5 s intervals.
4. Local edits are sent to `/app/document`. Until the first sync completes they are queued, then flushed in order.
5. On leaving, the client publishes a `LEAVE` presence message to `/app/presence`.

---

## API reference

All endpoints except `/api/auth/*` require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account (`username`, `email`, `password`) |
| POST | `/api/auth/login` | Log in (`email`, `password`); returns a JWT |

### Rooms

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/rooms` | Create a room |
| GET | `/api/rooms/my` | Rooms you belong to |
| POST | `/api/rooms/join` | Request to join (`inviteCode`, `requestedRole`) |
| GET | `/api/rooms/my/requests` | Join requests for rooms you own |
| GET | `/api/rooms/{roomId}/requests` | Join requests for one room |
| PUT | `/api/rooms/requests/{membershipId}` | Approve or reject a request |
| GET | `/api/rooms/{roomId}/members` | List members |
| DELETE | `/api/rooms/{roomId}/members/{userId}` | Remove a member |
| POST | `/api/rooms/{roomId}/invitations` | Invite by email (`email`, `role`) |
| GET | `/api/rooms/invitations/my` | Your pending invitations |
| POST | `/api/rooms/invitations/{invitationId}/{action}` | Accept or decline an invitation |

### Documents and checkpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/documents` | Create a document (name, `language`, room) |
| GET | `/api/documents/room/{roomId}` | Documents in a room |
| GET | `/api/documents/{documentId}` | Content, language and `baselineVersion` |
| GET | `/api/documents/{documentId}/snapshots` | List checkpoints |
| POST | `/api/documents/{documentId}/snapshots` | Save a checkpoint |
| POST | `/api/documents/{documentId}/snapshots/{snapshotId}/restore` | Restore a checkpoint |

### Notifications

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/notifications` | Your notifications |
| PUT | `/api/notifications/{id}/read` | Mark one as read |

### WebSocket (STOMP)

| Direction | Destination | Payload |
| --- | --- | --- |
| Client → server | `/app/document` | `{ documentId, baselineVersion, operation }` |
| Client → server | `/app/document/sync` | `{ documentId, clientId }` |
| Client → server | `/app/presence` | `{ documentId, clientId, type: "JOIN" \| "LEAVE" }` |
| Server → client | `/topic/document/{id}` | CRDT operations from collaborators |
| Server → client | `/topic/document/{id}/sync/{clientId}` | Initial state for one client |
| Server → client | `/topic/document/{id}/presence` | Presence updates |

---

## Deployment

- **Frontend:** static site on Render. Build command `npm run build`, publish directory `dist`. Set `VITE_API_URL` to your backend URL. For client-side routing, add a rewrite rule from `/*` to `/index.html`.
- **Backend:** web service on Render. Set the backend environment variables and allow the frontend origin in CORS.

---

## Roadmap

- Remote cursors and selections
- Code execution and an output panel
- Per-document chat
- Offline persistence of pending operations
- Move the WebSocket URL into an environment variable
