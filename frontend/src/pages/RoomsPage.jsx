import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { apiFetch } from "../services/api";

export default function RoomsPage({ onLogout }) {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Modal state for creating a room
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [creating, setCreating] = useState(false);

    // Modal state for joining a room
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [requestedRole, setRequestedRole] = useState("EDITOR");
    const [joining, setJoining] = useState(false);

    // Role options with descriptions for better UX
    const roleOptions = [
    { id: "VIEWER", label: "Viewer", desc: "Can view files & chat" },
    { id: "MEMBER", label: "Editor", desc: "Can edit and write code" },
];

    useEffect(() => {
        fetchRooms();
    }, []);

    async function fetchRooms() {
        try {
            setLoading(true);
            const response = await apiFetch("/api/rooms/my");
            if (response.status === 401 || response.status === 403) return;

            if (!response.ok) {
                throw new Error("Failed to load rooms");
            }

            const data = await response.json();
            setRooms(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Could not fetch rooms");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateRoom(e) {
        e.preventDefault();
        if (!roomName.trim()) return;

        try {
            setCreating(true);
            const response = await apiFetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: roomName }),
            });

            if (!response.ok) {
                throw new Error("Failed to create room");
            }

            setRoomName("");
            setIsCreateOpen(false);
            fetchRooms();
        } catch (err) {
            setError(err.message || "Failed to create room");
        } finally {
            setCreating(false);
        }
    }

    async function handleJoinRoom(e) {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        try {
            setJoining(true);
            const response = await apiFetch("/api/rooms/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: inviteCode.trim(), requestedRole }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to join room");
            }

            setInviteCode("");
            setIsJoinOpen(false);
            navigate("/requests");
        } catch (err) {
            setError(err.message || "Failed to join room");
        } finally {
            setJoining(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">
            <TopBar onLogout={onLogout} />

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Rooms</h1>
                        <p className="text-sm text-gray-400">
                            Access your workspaces and real-time collaboration sessions.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsJoinOpen(true)}
                            className="rounded-xl border border-gray-800 bg-[#111827] px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            Join with Code
                        </button>
                        <button
                            onClick={() => navigate("/requests")}
                            className="rounded-xl border border-gray-800 bg-[#111827] px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            Requests & Invitations
                        </button>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500 transition-colors"
                        >
                            + New Room
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                    <div className="rounded-2xl border border-gray-800 bg-[#111827] p-12 text-center">
                        <p className="text-gray-400">You don't belong to any rooms yet.</p>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
                        >
                            Create Your First Room
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room, index) => (
                            <div
                                key={room.membershipId || index}
                                onClick={() => room.roomId && navigate(`/rooms/${room.roomId}`, { state: { room } })}
                                className="group cursor-pointer rounded-2xl border border-gray-800 bg-[#111827] p-6 transition hover:border-gray-700 hover:bg-[#161f30]"
                            >
                                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400">
                                    {room.roomName || "Untitled Room"}
                                </h3>
                                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                    <span>Role: <strong className="text-gray-200">{room.role || "MEMBER"}</strong></span>
                                    <span className="font-mono text-[10px] text-gray-500">{room.inviteCode}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Room Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-2xl">
                        <h2 className="text-lg font-semibold text-white">Create a New Room</h2>
                        <form onSubmit={handleCreateRoom} className="mt-4">
                            <label className="block text-xs font-medium text-gray-400">Room Name</label>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="e.g. Engineering Sync"
                                className="mt-1.5 w-full rounded-xl border border-gray-800 bg-[#0b0f19] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                autoFocus
                            />
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Room Modal */}
            {isJoinOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-2xl">
                        <h2 className="text-lg font-semibold text-white">Join Room by Code</h2>
                        <form onSubmit={handleJoinRoom} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400">Invite Code</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    placeholder="Enter room invite code"
                                    className="mt-1.5 w-full rounded-xl border border-gray-800 bg-[#0b0f19] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">Requested Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {roleOptions.map((role) => {
                                        const isSelected = requestedRole === role.id;
                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setRequestedRole(role.id)}
                                                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? "border-indigo-500 bg-indigo-600/10 text-white shadow-sm ring-1 ring-indigo-500"
                                                        : "border-gray-800 bg-[#0b0f19] text-gray-400 hover:border-gray-700 hover:text-gray-300"
                                                }`}
                                            >
                                                <span className={`text-xs font-bold ${isSelected ? "text-indigo-400" : "text-gray-200"}`}>
                                                    {role.label}
                                                </span>
                                                <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                    {role.desc}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsJoinOpen(false)}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={joining}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
                                >
                                    {joining ? "Sending Request..." : "Send Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}