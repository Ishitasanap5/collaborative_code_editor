import { Client } from "@stomp/stompjs";

const DEBUG = false;

const SYNC_RETRY_MS = 1500;
const MAX_SYNC_ATTEMPTS = 6;

const log = (...args) => {
  if (DEBUG) console.log(...args);
};

let client = null;

let currentDocumentId = null;
let currentClientId = null;

let handlers = {};

let synced = false;
let syncTimer = null;
let syncAttempts = 0;

let pendingOutgoingOperations = [];
let pendingDocumentId = null;

export function connectToDocument(
  documentId,
  clientId,
  onMessage,
  onSync,
  onPresence,
  onConnected,
  onDisconnected
) {
  if (client) {
    teardownClient();
  }

  const docId = Number(documentId);

  if (pendingDocumentId !== docId) {
    pendingOutgoingOperations = [];
    pendingDocumentId = docId;
  }

  currentDocumentId = docId;
  currentClientId = clientId;

  handlers = {
    onMessage,
    onSync,
    onPresence,
    onConnected,
    onDisconnected
  };

  synced = false;

  const token = localStorage.getItem("token");

  const stomp = new Client({
    brokerURL: "ws://localhost:8080/ws",
    reconnectDelay: 5000,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      clientId: clientId
    },

    onConnect: () => {
      if (client !== stomp) return;

      log("🟢 STOMP connected:", docId, clientId);
      synced = false;

      subscribe(
        stomp,
        `/topic/document/${docId}`,
        (data) => handlers.onMessage?.(data)
      );

      subscribe(
        stomp,
        `/topic/document/${docId}/sync/${clientId}`,
        handleSyncPayload
      );

      subscribe(
        stomp,
        `/topic/document/${docId}/presence`,
        (data) => handlers.onPresence?.(data)
      );

      sendPresence("JOIN");
      beginSync();

      handlers.onConnected?.();
    },

    onStompError: (frame) => {
      console.error("❌ STOMP ERROR:", frame.headers, frame.body);
    },

    onWebSocketError: (error) => {
      console.error("❌ WEBSOCKET ERROR:", error);
    },

    onWebSocketClose: () => {
      if (client !== stomp) return;

      log("🔴 WebSocket closed");
      synced = false;
      stopSyncTimer();

      handlers.onDisconnected?.();
    }
  });

  client = stomp;
  stomp.activate();
}

function subscribe(stomp, destination, handler) {
  log("📡 SUBSCRIBING:", destination);

  stomp.subscribe(destination, (message) => {
    let data;

    try {
      data = JSON.parse(message.body);
    } catch (error) {
      console.error("❌ Bad JSON from", destination, error);
      return;
    }

    try {
      handler(data);
    } catch (error) {
      console.error("❌ Handler failed for", destination, error);
    }
  });
}

function beginSync() {
  stopSyncTimer();
  syncAttempts = 0;
  sendSyncRequest();

  syncTimer = setInterval(() => {
    if (synced || !client?.connected) {
      stopSyncTimer();
      return;
    }

    if (syncAttempts >= MAX_SYNC_ATTEMPTS) {
      console.error("❌ Synchronization got no reply, giving up");
      stopSyncTimer();

      synced = true;
      flushPendingOperations();
      return;
    }

    sendSyncRequest();
  }, SYNC_RETRY_MS);
}

function sendSyncRequest() {
  if (!client?.connected) return;

  syncAttempts++;
  log("🔄 Sync request, attempt", syncAttempts);

  client.publish({
    destination: "/app/document/sync",
    body: JSON.stringify({
      documentId: currentDocumentId,
      clientId: currentClientId
    })
  });
}

function handleSyncPayload(payload) {
  synced = true;
  stopSyncTimer();

  handlers.onSync?.(payload);
  flushPendingOperations();
}

function stopSyncTimer() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

function sendPresence(type) {
  if (!client?.connected) return;

  client.publish({
    destination: "/app/presence",
    body: JSON.stringify({
      documentId: currentDocumentId,
      clientId: currentClientId,
      type: type
    })
  });
}

export function sendCRDTOperation(
  documentId,
  operation,
  baselineVersion
) {
  const message = {
    documentId: Number(documentId),
    baselineVersion: baselineVersion === undefined ? null : baselineVersion,
    operation: operation
  };

  if (client?.connected && synced) {
    publishOperation(message);
    return;
  }

  pendingOutgoingOperations.push(message);
}

function publishOperation(message) {
  if (!client?.connected) return false;

  client.publish({
    destination: "/app/document",
    body: JSON.stringify(message)
  });

  return true;
}

function flushPendingOperations() {
  if (!client?.connected || !synced) return;

  while (pendingOutgoingOperations.length > 0) {
    const message = pendingOutgoingOperations.shift();

    if (!publishOperation(message)) {
      pendingOutgoingOperations.unshift(message);
      return;
    }
  }
}

export function discardPendingOperations() {
  pendingOutgoingOperations = [];
}

function teardownClient() {
  stopSyncTimer();

  const old = client;
  client = null;
  synced = false;

  if (old) {
    old.deactivate();
  }
}

export function disconnectWebSocket() {
  if (!client) return;

  if (client.connected) {
    sendPresence("LEAVE");
  }

  teardownClient();
}

export function isWebSocketConnected() {
  return Boolean(client?.connected);
}

export function getPendingOperationCount() {
  return pendingOutgoingOperations.length;
}