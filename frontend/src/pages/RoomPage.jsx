import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { apiFetch } from "../services/api";

export default function RoomPage({ onLogout }) {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [room, setRoom] = useState(location.state?.room || null);
    const [members, setMembers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [documents, setDocuments] = useState([]);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");

    // Modal states
    const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
    const [docName, setDocName] = useState("");
    const [docLanguage, setDocLanguage] = useState("java");
    const [creatingDoc, setCreatingDoc] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [processingId, setProcessingId] = useState(null);

    // In-app removal modal state
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [removing, setRemoving] = useState(false);

    //ROOM ROLE
    const currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const currentUserId =
        currentUser?.id || currentUser?.userId;

    const currentUserRole = members.find(
        (member) =>
            String(member.userId) === String(currentUserId)
    )?.role;

    const canInvite = currentUserRole === "OWNER";

    // ROLE OPTIONS
    const roleOptions = [
        {
            id: "VIEWER",
            label: "Viewer",
            desc: "Can view files & chat"
        },
        {
            id: "MEMBER",
            label: "Editor",
            desc: "Can edit and write code"
        }
    ];

    // LOAD ROOM DATA
    useEffect(() => {
        fetchRoomDetails();
    }, [roomId]);

    async function fetchRoomDetails() {
        try {
            setLoading(true);
            setError("");

            const [memRes, reqRes, docRes] = await Promise.all([
                apiFetch(`/api/rooms/${roomId}/members`),
                apiFetch(`/api/rooms/${roomId}/requests`),
                apiFetch(`/api/documents/room/${roomId}`)
            ]);

            // Members
            if (memRes.ok) {
                setMembers(await memRes.json());
            }

            // Pending requests
            if (reqRes.ok) {
                setPendingRequests(await reqRes.json());
            }

            // Documents
            if (docRes.ok) {
                setDocuments(await docRes.json());
            }
        } catch (err) {
            console.error("Failed to load room data:", err);
            setError("Failed to load room administration data.");
        } finally {
            setLoading(false);
        }
    }

    // CREATE DOCUMENT
    async function handleCreateDocument(e) {
        e.preventDefault();

        if (!docName.trim()) {
            return;
        }

        try {
            setCreatingDoc(true);
            setError("");
            setSuccessMsg("");

            const createRes = await apiFetch("/api/documents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: docName.trim(),
                    language: docLanguage,
                    content: "",
                    roomId: Number(roomId)
                })
            });

            if (!createRes.ok) {
                const text = await createRes.text();

                throw new Error(
                    text || "Failed to create document"
                );
            }

            await createRes.json();

            setDocName("");
            setDocLanguage("java");
            setIsCreateDocOpen(false);
            setSuccessMsg("Document created successfully!");

            // Refresh room documents
            await fetchRoomDetails();

        } catch (err) {
            console.error("Failed to create document:", err);
            setError(err.message);
        } finally {
            setCreatingDoc(false);
        }
    }

    // APPROVE / REJECT JOIN REQUEST
    async function handleRequestAction(
        membershipId,
        status,
        requestedRole
    ) {
        setProcessingId(membershipId);
        setError("");
        setSuccessMsg("");

        try {
            const isApprove = status === "APPROVED";

            const res = await apiFetch(
                `/api/rooms/requests/${membershipId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        approve: isApprove,
                        role: isApprove
                            ? requestedRole || "MEMBER"
                            : null
                    })
                }
            );

            if (!res.ok) {
                const text = await res.text();

                throw new Error(
                    text || "Failed to update request"
                );
            }

            const updatedMembership = await res.json();

            setSuccessMsg(
                `Request ${status.toLowerCase()} successfully.`
            );

            const targetReq = pendingRequests.find(
                (req) =>
                    String(req.membershipId ?? req.id) ===
                    String(membershipId)
            );

            // Remove request immediately from local state
            setPendingRequests((prev) =>
                prev.filter(
                    (req) =>
                        String(req.membershipId ?? req.id) !==
                        String(membershipId)
                )
            );

            // Add approved member immediately
            if (isApprove) {
                setMembers((prev) => {
                    const alreadyExists = prev.some(
                        (member) =>
                            String(member.userId) ===
                            String(
                                updatedMembership?.userId ??
                                targetReq?.userId
                            )
                    );

                    if (alreadyExists) {
                        return prev;
                    }

                    return [
                        ...prev,
                        {
                            membershipId:
                                updatedMembership?.membershipId ??
                                targetReq?.membershipId ??
                                targetReq?.id,

                            userId:
                                updatedMembership?.userId ??
                                targetReq?.userId,

                            username:
                                updatedMembership?.username ??
                                targetReq?.username,

                            email:
                                updatedMembership?.email ??
                                targetReq?.email,

                            role:
                                updatedMembership?.role ??
                                targetReq?.requestedRole ??
                                requestedRole ??
                                "MEMBER"
                        }
                    ];
                });
            }

            // Sync with server
            await fetchRoomDetails();

        } catch (err) {
            console.error(
                "Failed to update join request:",
                err
            );

            setError(
                err.message || "Failed to update request"
            );
        } finally {
            setProcessingId(null);
        }
    }

    // REMOVE MEMBER
    async function confirmRemoveMember() {
        if (!memberToRemove) {
            return;
        }

        try {
            setRemoving(true);
            setError("");
            setSuccessMsg("");

            const targetUserId =
                memberToRemove.userId ||
                memberToRemove.id;

            const res = await apiFetch(
                `/api/rooms/${roomId}/members/${targetUserId}`,
                {
                    method: "DELETE"
                }
            );

            if (!res.ok) {
                const text = await res.text();

                throw new Error(
                    text || "Failed to remove member"
                );
            }

            setSuccessMsg(
                `Successfully removed ${memberToRemove.username}.`
            );

            setMemberToRemove(null);

            await fetchRoomDetails();

        } catch (err) {
            console.error(
                "Failed to remove member:",
                err
            );

            setError(err.message);
        } finally {
            setRemoving(false);
        }
    }

    // SEND INVITATION
    async function handleSendInvite(e) {
        e.preventDefault();

        if (!inviteEmail.trim()) {
            return;
        }

        try {
            setError("");
            setSuccessMsg("");

            const res = await apiFetch(
                `/api/rooms/${roomId}/invitations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: inviteEmail.trim(),
                        role: inviteRole
                    })
                }
            );

            if (!res.ok) {
                const text = await res.text();

                throw new Error(
                    text || "Failed to send invitation"
                );
            }

            setInviteEmail("");

            setSuccessMsg(
                "Invitation sent successfully!"
            );

        } catch (err) {
            console.error(
                "Failed to send invitation:",
                err
            );

            setError(err.message);
        }
    }

    // UI
    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">

            <TopBar onLogout={onLogout} />

            <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">

                {/*HEADER */}

                <div className="flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold tracking-tight">
                            {room?.roomName || "Room Administration"}
                        </h1>

                        <p className="text-sm text-gray-400 font-mono mt-1">
                            Invite Code:{" "}
                            {room?.inviteCode || "N/A"}
                        </p>

                    </div>

                    <button
                        onClick={() => navigate("/rooms")}
                        className="rounded-xl border border-gray-800 bg-[#111827] px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Back to Rooms
                    </button>

                </div>

                {/* MESSAGES */}

                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                        {successMsg}
                    </div>
                )}

                {/*LOADING*/}

                {loading ? (

                    <div className="py-20 text-center text-gray-500">
                        Loading details...
                    </div>

                ) : (

                    <div className="grid gap-8 lg:grid-cols-2">

                        {/* DOCUMENTS SECTION*/}

                        <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-xl space-y-4 lg:col-span-2">

                            <div className="flex items-center justify-between">

                                <h2 className="font-semibold text-gray-200 text-lg">
                                    Room Documents
                                </h2>

                                {currentUserRole !== "VIEWER" && (
    <button
        onClick={() =>
            setIsCreateDocOpen(true)
        }
        className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium hover:bg-indigo-500 transition-colors"
    >
        + New Document
    </button>
)}

                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                {documents.length === 0 ? (

                                    <p className="text-sm text-gray-500 py-4 col-span-full">
                                        No documents found in this room yet.
                                    </p>

                                ) : (

                                    documents.map((doc, idx) => {

                                        const docId =
                                            doc.id ||
                                            doc.documentId ||
                                            idx;

                                        return (

                                            <div
                                                key={docId}
                                                onClick={() =>
                                                    navigate(
                                                        `/editor/${doc.id || doc.documentId}`
                                                    )
                                                }
                                                className="group cursor-pointer rounded-xl border border-gray-800/60 bg-[#1f2937]/40 p-4 hover:border-indigo-500 transition-all"
                                            >

                                                <h3 className="font-medium text-white group-hover:text-indigo-400 truncate">
                                                    {doc.name}
                                                </h3>

                                                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">

                                                    <span>
                                                        Language:{" "}
                                                        <strong className="text-gray-300">
                                                            {doc.language || "text"}
                                                        </strong>
                                                    </span>

                                                    <span className="text-indigo-400 font-medium">
                                                        Open →
                                                    </span>

                                                </div>

                                            </div>

                                        );
                                    })

                                )}

                            </div>

                        </section>

                        {/*MEMBERS SECTION*/}

                        <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-xl space-y-4">

                            <h2 className="font-semibold text-gray-200 text-lg">
                                Room Members
                            </h2>

                            <div className="space-y-3">

                                {members.length === 0 ? (

                                    <p className="text-sm text-gray-500 py-4">
                                        No members found.
                                    </p>

                                ) : (

                                    members.map((m, idx) => {

                                        const memberKey =
                                            m.membershipId ||
                                            m.userId ||
                                            m.id ||
                                            idx;

                                        return (

                                            <div
                                                key={memberKey}
                                                className="flex items-center justify-between rounded-xl border border-gray-800/60 bg-[#1f2937]/50 p-4"
                                            >

                                                <div>

                                                    <p className="font-medium text-white">

                                                        {m.username}{" "}

                                                        <span className="text-xs text-gray-400">
                                                            ({m.email})
                                                        </span>

                                                    </p>

                                                    <p className="text-xs text-indigo-400 mt-0.5">
                                                        Role: {m.role}
                                                    </p>

                                                </div>

                                                {canInvite &&
                                                    m.role !== "OWNER" && (

                                                        <button
                                                            onClick={() =>
                                                                setMemberToRemove(m)
                                                            }
                                                            className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition-colors"
                                                        >
                                                            Remove
                                                        </button>

                                                    )}

                                            </div>

                                        );
                                    })

                                )}

                            </div>

                            {/* INVITATION FORM - OWNER ONLY */}

                            {canInvite && (

                                <form
                                    onSubmit={handleSendInvite}
                                    className="mt-6 pt-6 border-t border-gray-800 space-y-4"
                                >

                                    <div>

                                        <h3 className="text-sm font-semibold text-gray-300">
                                            Invite User by Email
                                        </h3>

                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Send a workspace invitation directly to a user's email.
                                        </p>

                                    </div>

                                    <div className="space-y-3">

                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) =>
                                                setInviteEmail(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="user@example.com"
                                            className="w-full rounded-xl border border-gray-800 bg-[#0b0f19] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                            required
                                        />

                                        <div>

                                            <label className="block text-xs font-medium text-gray-400 mb-2">
                                                Select Permission Role
                                            </label>

                                            <div className="grid grid-cols-2 gap-2">

                                                {roleOptions.map(
                                                    (role) => {

                                                        const isSelected =
                                                            inviteRole ===
                                                            role.id;

                                                        return (

                                                            <button
                                                                key={role.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    setInviteRole(
                                                                        role.id
                                                                    )
                                                                }
                                                                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                                                    isSelected
                                                                        ? "border-indigo-500 bg-indigo-600/10 text-white shadow-sm ring-1 ring-indigo-500"
                                                                        : "border-gray-800 bg-[#0b0f19] text-gray-400 hover:border-gray-700 hover:text-gray-300"
                                                                }`}
                                                            >

                                                                <span
                                                                    className={`text-xs font-bold ${
                                                                        isSelected
                                                                            ? "text-indigo-400"
                                                                            : "text-gray-200"
                                                                    }`}
                                                                >
                                                                    {role.label}
                                                                </span>

                                                                <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                                    {role.desc}
                                                                </span>

                                                            </button>

                                                        );
                                                    }
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500 transition-colors mt-2"
                                    >
                                        Send Invitation
                                    </button>

                                </form>

                            )}

                        </section>

                        {/* PENDING JOIN REQUESTS*/}

                        <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-xl space-y-4">

                            <h2 className="font-semibold text-gray-200 text-lg">
                                Pending Join Requests
                            </h2>

                            {pendingRequests.length === 0 ? (

                                <p className="text-sm text-gray-500 py-6">
                                    No pending join requests.
                                </p>

                            ) : (

                                <div className="space-y-3">

                                    {pendingRequests.map(
                                        (req, idx) => {

                                            const reqKey =
                                                req.membershipId ||
                                                req.id ||
                                                idx;

                                            const targetId =
                                                req.membershipId ||
                                                req.id;

                                            return (

                                                <div
                                                    key={reqKey}
                                                    className="flex items-center justify-between rounded-xl border border-gray-800/60 bg-[#1f2937]/50 p-4"
                                                >

                                                    <div>

                                                        <p className="font-medium text-white">

                                                            {req.username}{" "}

                                                            <span className="text-xs text-gray-400">
                                                                ({req.email})
                                                            </span>

                                                        </p>

                                                        <p className="text-xs text-gray-400">

                                                            Requested Role:{" "}

                                                            <span className="text-indigo-400">
                                                                {req.requestedRole}
                                                            </span>

                                                        </p>

                                                    </div>

                                                    <div className="flex gap-2">

                                                        <button
                                                            disabled={
                                                                processingId ===
                                                                targetId
                                                            }
                                                            onClick={() =>
                                                                handleRequestAction(
                                                                    targetId,
                                                                    "APPROVED",
                                                                    req.requestedRole
                                                                )
                                                            }
                                                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                                                        >
                                                            Approve
                                                        </button>

                                                        <button
                                                            disabled={
                                                                processingId ===
                                                                targetId
                                                            }
                                                            onClick={() =>
                                                                handleRequestAction(
                                                                    targetId,
                                                                    "REJECTED",
                                                                    req.requestedRole
                                                                )
                                                            }
                                                            className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
                                                        >
                                                            Reject
                                                        </button>

                                                    </div>

                                                </div>

                                            );
                                        }
                                    )}

                                </div>

                            )}

                        </section>

                    </div>

                )}

            </main>

            {/* CREATE DOCUMENT MODAL */}

            {isCreateDocOpen && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-2xl space-y-4">

                        <h2 className="text-lg font-semibold text-white">
                            Create New Document
                        </h2>

                        <form
                            onSubmit={handleCreateDocument}
                            className="space-y-4"
                        >

                            {/* Document Name */}

                            <div>

                                <label className="block text-xs font-medium text-gray-400">
                                    Document Name
                                </label>

                                <input
                                    type="text"
                                    value={docName}
                                    onChange={(e) =>
                                        setDocName(e.target.value)
                                    }
                                    placeholder="e.g. Solution.java"
                                    className="mt-1.5 w-full rounded-xl border border-gray-800 bg-[#0b0f19] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    required
                                    autoFocus
                                />

                            </div>

                            {/* Language */}

                            <div>

                                <label className="block text-xs font-medium text-gray-400">
                                    Language
                                </label>

                                <select
                                    value={docLanguage}
                                    onChange={(e) =>
                                        setDocLanguage(
                                            e.target.value
                                        )
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-gray-800 bg-[#0b0f19] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                >

                                    <option value="java">
                                        Java
                                    </option>

                                    <option value="javascript">
                                        JavaScript
                                    </option>

                                    <option value="typescript">
                                        TypeScript
                                    </option>

                                    <option value="python">
                                        Python
                                    </option>

                                    <option value="cpp">
                                        C++
                                    </option>

                                </select>

                            </div>

                            {/* Buttons */}

                            <div className="flex justify-end gap-3 pt-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsCreateDocOpen(false)
                                    }
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creatingDoc}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                                >
                                    {creatingDoc
                                        ? "Creating..."
                                        : "Create Document"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/*REMOVE MEMBER MODAL*/}

            {memberToRemove && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-2xl space-y-4">

                        <div className="space-y-1">

                            <h2 className="text-lg font-semibold text-white">
                                Remove Member
                            </h2>

                            <p className="text-sm text-gray-400">

                                Are you sure you want to remove{" "}

                                <strong className="text-white">
                                    {memberToRemove.username}
                                </strong>{" "}

                                from this room? They will lose access immediately.

                            </p>

                        </div>

                        <div className="flex justify-end gap-3 pt-2">

                            <button
                                type="button"
                                disabled={removing}
                                onClick={() =>
                                    setMemberToRemove(null)
                                }
                                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={removing}
                                onClick={confirmRemoveMember}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                                {removing
                                    ? "Removing..."
                                    : "Remove Member"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}