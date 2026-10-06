import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { apiFetch } from "../services/api";

import EditorTopBar from "../components/editor/EditorTopBar";
import Sidebar from "../components/layout/SideBar";
import BottomBar from "../components/layout/BottomBar";
import CodeEditor from "../components/editor/CodeEditor";

import {
    connectToDocument,
    sendCRDTOperation,
    disconnectWebSocket,
    discardPendingOperations
} from "../services/websocketService";

import { CRDTDocument } from "../crdt/CRDTDocument";

function readBaselineVersion(data) {
    const raw = data.baselineVersion ?? data.crdtBaselineVersion;

    if (raw === undefined || raw === null) {
        console.warn(
            "⚠️ Document response has no baselineVersion / crdtBaselineVersion. " +
            "Expose it in the Document DTO, otherwise baseline ids can mismatch."
        );
        return 0;
    }

    return Number(raw);
}

function EditorPage({ onLogout }) {
    const { documentId } = useParams();

    const clientIdRef = useRef(`User-${crypto.randomUUID()}`);

    const crdtRef = useRef(null);
    if (crdtRef.current === null) {
        crdtRef.current = new CRDTDocument(clientIdRef.current);
    }

    const baselineVersionRef = useRef(0);
    const initialContentRef = useRef("");
    const editorRef = useRef(null);

    const applyingRemoteChange = useRef(false);
    const handlersRef = useRef({});

    const [documentData, setDocumentData] = useState(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);

    const [checkpointSaved, setCheckpointSaved] = useState(true);
    const [savingCheckpoint, setSavingCheckpoint] = useState(false);
    const [checkpointMessage, setCheckpointMessage] = useState("");

    const [snapshots, setSnapshots] = useState([]);
    const [loadingSnapshots, setLoadingSnapshots] = useState(false);

    const [userRole, setUserRole] = useState(null);
    const [loadingRole, setLoadingRole] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadRole(roomId) {
            if (!roomId) {
                console.warn("⚠️ Document does not contain room ID");
                return null;
            }

            try {
                const roomsResponse = await apiFetch("/api/rooms/my");
                if (!roomsResponse.ok) return null;

                const rooms = await roomsResponse.json();
                const currentRoom = rooms.find(
                    room => String(room.roomId) === String(roomId)
                );

                if (!currentRoom) {
                    console.warn("⚠️ Current room not found in user's rooms");
                    return null;
                }

                return currentRoom.role;
            } catch (roleError) {
                console.error("❌ Failed to load user role:", roleError);
                return null;
            }
        }

        async function loadDocument() {
            try {
                setLoading(true);
                setLoadingRole(true);
                setError(null);

                const response = await apiFetch(`/api/documents/${documentId}`);

                if (!response.ok) {
                    throw new Error("Failed to load document");
                }

                const data = await response.json();
                if (cancelled) return;

                const roomId =
                    data.roomId ?? data.room?.id ?? data.room?.roomId;

                const role = await loadRole(roomId);
                if (cancelled) return;

                setUserRole(role);

                const baselineVersion = readBaselineVersion(data);
                baselineVersionRef.current = baselineVersion;

                crdtRef.current = new CRDTDocument(clientIdRef.current);
                crdtRef.current.initializeFromText(
                    data.content || "",
                    Number(documentId),
                    baselineVersion
                );

                initialContentRef.current = crdtRef.current.getText();
                setDocumentData(data);
            } catch (err) {
                console.error("❌ Document loading failed:", err);
                if (!cancelled) {
                    setError(err.message || "Failed to load document");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setLoadingRole(false);
                }
            }
        }

        loadDocument();

        return () => {
            cancelled = true;
        };
    }, [documentId]);

    const canEdit = userRole === "OWNER" || userRole === "MEMBER" || userRole === "EDITOR" || userRole === "ADMIN";
    const isViewer = !canEdit && userRole !== null;

    const syncMonacoFromCrdt = () => {
        const model = editorRef.current?.getModel();
        if (!model) return;

        const oldText = model.getValue();
        const newText = crdtRef.current.getText();

        if (oldText === newText) return;

        let start = 0;
        const min = Math.min(oldText.length, newText.length);

        while (start < min && oldText[start] === newText[start]) {
            start++;
        }

        let oldEnd = oldText.length;
        let newEnd = newText.length;

        while (
            oldEnd > start &&
            newEnd > start &&
            oldText[oldEnd - 1] === newText[newEnd - 1]
        ) {
            oldEnd--;
            newEnd--;
        }

        const from = model.getPositionAt(start);
        const to = model.getPositionAt(oldEnd);

        applyingRemoteChange.current = true;

        try {
            model.applyEdits([{
                range: {
                    startLineNumber: from.lineNumber,
                    startColumn: from.column,
                    endLineNumber: to.lineNumber,
                    endColumn: to.column
                },
                text: newText.slice(start, newEnd)
            }]);
        } finally {
            applyingRemoteChange.current = false;
        }
    };

    const resetFromBaseline = (content, version) => {
        baselineVersionRef.current = version;

        crdtRef.current.resetFromText(
            content ?? "",
            Number(documentId),
            version
        );

        discardPendingOperations();
        syncMonacoFromCrdt();

        setDocumentData(current =>
            current ? { ...current, baselineVersion: version } : current
        );
    };

    // REMOTE MESSAGES
    const handleRemoteOperation = (message) => {
        if (!message) return;

        if (message.type === "RESTORE") {
            if (message.content === undefined || message.content === null) {
                return;
            }

            const incoming = Number(
                message.baselineVersion ?? baselineVersionRef.current
            );

            if (incoming < baselineVersionRef.current) {
                console.warn("⚠️ Ignoring stale restore");
                return;
            }

            resetFromBaseline(message.content, incoming);
            return;
        }

        const operation = message.operation;
        if (!operation) return;

        if (
            message.baselineVersion !== undefined &&
            message.baselineVersion !== null &&
            Number(message.baselineVersion) !== baselineVersionRef.current
        ) {
            console.warn(
                "⚠️ Ignoring operation from baseline",
                message.baselineVersion,
                "(current:", baselineVersionRef.current + ")"
            );
            return;
        }

        if (operation.clientId === clientIdRef.current) return;

        crdtRef.current.applyOperation(operation);
        syncMonacoFromCrdt();
    };

    const handleSync = (payload) => {
        const state = Array.isArray(payload)
            ? { operations: payload }
            : payload;

        if (!state) return;

        if (
            state.baselineVersion !== undefined &&
            state.baselineVersion !== null &&
            Number(state.baselineVersion) !== baselineVersionRef.current
        ) {
            resetFromBaseline(
                state.content ?? "",
                Number(state.baselineVersion)
            );
        }

        const operations = Array.isArray(state.operations)
            ? state.operations
            : [];

        for (const operation of operations) {
            if (!operation) continue;
            if (operation.clientId === clientIdRef.current) continue;

            crdtRef.current.applyOperation(operation);
        }

        crdtRef.current.applyPendingOperations();
        syncMonacoFromCrdt();
    };

    const handlePresence = (message) => {
        if (message && Array.isArray(message.activeUsers)) {
            setActiveUsers(message.activeUsers);
        }
    };

    handlersRef.current = {
        remote: handleRemoteOperation,
        sync: handleSync,
        presence: handlePresence
    };

    // CONNECT WEBSOCKET
    useEffect(() => {
        if (loading || loadingRole || error) return;

        connectToDocument(
            documentId,
            clientIdRef.current,
            (message) => handlersRef.current.remote?.(message),
            (payload) => handlersRef.current.sync?.(payload),
            (message) => handlersRef.current.presence?.(message),
            () => setConnected(true),
            () => setConnected(false)
        );

        return () => {
            disconnectWebSocket();
            setConnected(false);
        };
    }, [documentId, loading, loadingRole, error]);

    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;

        const model = editor.getModel();
        if (!model) return;

        applyingRemoteChange.current = true;

        try {
            if (monaco?.editor?.EndOfLineSequence) {
                model.setEOL(monaco.editor.EndOfLineSequence.LF);
            }

            model.setValue(crdtRef.current.getText());
        } finally {
            applyingRemoteChange.current = false;
        }
    };

    const handleEditorChange = (value, event) => {
        if (isViewer) return;
        if (applyingRemoteChange.current) return;
        if (!event?.changes?.length) return;

        setCheckpointSaved(false);
        setCheckpointMessage("");

        const crdt = crdtRef.current;
        const send = (operation) =>
            sendCRDTOperation(documentId, operation, crdt.baselineVersion);

        const changes = [...event.changes].sort(
            (a, b) => b.rangeOffset - a.rangeOffset
        );

        for (const change of changes) {
            const startOffset = change.rangeOffset;

            if (change.rangeLength > 0) {
                const victims = crdt.getElementsInRange(
                    startOffset,
                    change.rangeLength
                );

                for (const element of victims) {
                    const operation = crdt.delete(element.id);
                    if (operation) send(operation);
                }
            }

            if (change.text && change.text.length > 0) {
                const previous = crdt.getElementBeforePosition(startOffset);
                let afterId = previous ? previous.id : null;

                for (let i = 0; i < change.text.length; i++) {
                    const operation = crdt.insert(change.text[i], afterId);
                    if (!operation) continue;

                    send(operation);
                    afterId = operation.element.id;
                }
            }
        }
    };

    // CHECKPOINTS
    const saveCheckpoint = async () => {
        if (isViewer || savingCheckpoint) return;

        try {
            setSavingCheckpoint(true);
            setCheckpointMessage("");

            const response = await apiFetch(
                `/api/documents/${documentId}/snapshots`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: crdtRef.current.getText()
                    })
                }
            );

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Failed to save checkpoint");
            }

            await response.json();

            setCheckpointSaved(true);
            setCheckpointMessage("✓ Checkpoint saved");
            loadSnapshots();
        } catch (err) {
            console.error("❌ Checkpoint save failed:", err);
            setCheckpointMessage(err.message || "Failed to save checkpoint");
        } finally {
            setSavingCheckpoint(false);
        }
    };

    const loadSnapshots = async () => {
        try {
            setLoadingSnapshots(true);

            const response = await apiFetch(
                `/api/documents/${documentId}/snapshots`
            );

            if (!response.ok) {
                throw new Error("Failed to load snapshots");
            }

            setSnapshots(await response.json());
        } catch (err) {
            console.error("❌ Failed to load snapshots:", err);
        } finally {
            setLoadingSnapshots(false);
        }
    };

    const restoreSnapshot = async (snapshotId) => {
        if (isViewer) return;

        const confirmed = window.confirm(
            "Restore this checkpoint? Your current document will be replaced with the saved version."
        );

        if (!confirmed) return;

        try {
            const response = await apiFetch(
                `/api/documents/${documentId}/snapshots/${snapshotId}/restore`,
                { method: "POST" }
            );

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Failed to restore snapshot");
            }

            const updatedDoc = await response.json();
            const newVersion = readBaselineVersion(updatedDoc);
            
            resetFromBaseline(updatedDoc.content || "", newVersion);
            loadSnapshots();
            
            setCheckpointSaved(true);
            setCheckpointMessage("✓ Restored checkpoint");
        } catch (err) {
            console.error("❌ Snapshot restore failed:", err);
            setCheckpointMessage(err.message || "Failed to restore snapshot");
        }
    };

    useEffect(() => {
        if (!documentId) return;
        loadSnapshots();
    }, [documentId]);

    // RENDER
    if (loading || loadingRole) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-white">
                Loading document...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-[#0d1117] text-white overflow-hidden">
            <EditorTopBar
                document={documentData}
                connected={connected}
                activeUsers={activeUsers}
                currentClientId={clientIdRef.current}
                onLogout={onLogout}
            />

            <div className="flex flex-1 min-h-0">
                <Sidebar
                    documentId={documentId}
                    snapshots={isViewer ? [] : snapshots}
                    loadingSnapshots={loadingSnapshots}
                    onRestoreSnapshot={restoreSnapshot}
                />

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="h-10 flex items-center justify-between px-4 border-b border-gray-800 bg-[#111827]">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-300">
                                {documentData?.name}
                                {!checkpointSaved && !isViewer && (
                                    <span className="text-yellow-400 ml-1">*</span>
                                )}
                            </span>

                            <span className="text-gray-500">
                                Document ID: {documentId}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {isViewer && (
                                <span className="rounded-full border border-purple-400/20 bg-purple-400/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-400">
                                    View only
                                </span>
                            )}

                            {checkpointMessage && !isViewer && (
                                <span
                                    className={`text-xs ${
                                        checkpointMessage.startsWith("✓")
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {checkpointMessage}
                                </span>
                            )}

                            {!isViewer && (
                                <button
                                    type="button"
                                    onClick={saveCheckpoint}
                                    disabled={checkpointSaved || savingCheckpoint}
                                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                                        checkpointSaved
                                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-500"
                                    }`}
                                >
                                    {savingCheckpoint
                                        ? "Saving..."
                                        : checkpointSaved
                                        ? "✓ Saved"
                                        : "Save Checkpoint"}
                                </button>
                            )}

                            <span className="text-xs text-gray-400">
                                {activeUsers.length} collaborators
                            </span>
                        </div>
                    </div>

                    {activeUsers.length > 0 && (
                        <div className="px-4 py-2 border-b border-gray-800 bg-[#0f172a]">
                            <div className="text-xs text-gray-400 mb-1">
                                ACTIVE COLLABORATORS
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {activeUsers.map(userId => (
                                    <div
                                        key={userId}
                                        className="flex items-center gap-2 text-xs text-gray-300"
                                    >
                                        <span className="text-green-400">🟢</span>
                                        <span>
                                            {userId === clientIdRef.current
                                                ? "You"
                                                : userId}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            defaultValue={initialContentRef.current}
                            language={documentData?.language || "java"}
                            onMount={handleEditorMount}
                            onChange={handleEditorChange}
                            readOnly={isViewer}
                        />
                    </div>

                    <div className="h-7 flex items-center px-3 gap-4 text-xs text-gray-500 border-t border-gray-800">
                        <span>{isViewer ? "View only" : "Editor"}</span>
                        <span>{connected ? "Connected" : "Disconnected"}</span>
                        <span>{documentData?.language || "text"}</span>
                        <span>UTF-8</span>
                        <span>LF</span>
                    </div>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}

export default EditorPage;