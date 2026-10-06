import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { apiFetch } from "../services/api";

export default function RoomDetailPage({ onLogout }) {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [room, setRoom] = useState(location.state?.room || null);
    const [members, setMembers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("EDITOR");
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        fetchRoomDetails();
    }, [roomId]);

    async function fetchRoomDetails() {
        try {
            setLoading(true);
            const [memRes, reqRes] = await Promise.all([
                apiFetch(`/api/rooms/${roomId}/members`),
                apiFetch(`/api/rooms/${roomId}/requests`)
            ]);

            if (memRes.ok) setMembers(await memRes.json());
            if (reqRes.ok) setPendingRequests(await reqRes.json());
        } catch (err) {
            setError("Failed to load room administration data.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRequestAction(membershipId, status) {
        try {
            const res = await apiFetch(`/api/rooms/requests/${membershipId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed to update request");
            
            setSuccessMsg(`Request ${status.toLowerCase()} successfully.`);
            fetchRoomDetails();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleRemoveMember(userId) {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            const res = await apiFetch(`/api/rooms/${roomId}/members/${userId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to remove member");
            
            setSuccessMsg("Member removed successfully.");
            fetchRoomDetails();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSendInvite(e) {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        try {
            const res = await apiFetch(`/api/rooms/${roomId}/invitations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to send invitation");
            }

            setInviteEmail("");
            setSuccessMsg("Invitation sent successfully!");
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">
            <TopBar onLogout={onLogout} />

            <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{room?.roomName || "Room Administration"}</h1>
                        <p className="text-sm text-gray-400 font-mono mt-1">Invite Code: {room?.inviteCode}</p>
                    </div>
                    <button
                        onClick={() => navigate("/rooms")}
                        className="rounded-xl border border-gray-800 bg-[#111827] px-4 py-2 text-sm font-medium hover:bg-gray-800"
                    >
                        Back to Rooms
                    </button>
                </div>

                {error && <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">{error}</div>}
                {successMsg && <div className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20">{successMsg}</div>}

                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading details...</div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-2">
                        
                        {/* MEMBERS SECTION */}
                        <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-xl space-y-4">
                            <h2 className="font-semibold text-gray-200 text-lg">Room Members</h2>
                            <div className="space-y-3">
                                {members.map((m) => (
                                    <div key={m.membershipId} className="flex items-center justify-between rounded-xl border border-gray-800/60 bg-[#1f2937]/50 p-4">
                                        <div>
                                            <p className="font-medium text-white">{m.username} <span className="text-xs text-gray-400">({m.email})</span></p>
                                            <p className="text-xs text-indigo-400 mt-0.5">Role: {m.role}</p>
                                        </div>
                                        {m.role !== "OWNER" && (
                                            <button
                                                onClick={() => handleRemoveMember(m.userId)}
                                                className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* INVITE FORM */}
                            <form onSubmit={handleSendInvite} className="mt-6 pt-6 border-t border-gray-800 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-300">Invite User by Email</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        className="flex-1 rounded-xl border border-gray-800 bg-[#0b0f19] px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="rounded-xl border border-gray-800 bg-[#0b0f19] px-3 py-2 text-sm text-white"
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="EDITOR">Editor</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
                                        Invite
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* PENDING JOIN REQUESTS SECTION */}
                        <section className="rounded-2xl border border-gray-800 bg-[#111827] p-6 shadow-xl space-y-4">
                            <h2 className="font-semibold text-gray-200 text-lg">Pending Join Requests</h2>
                            {pendingRequests.length === 0 ? (
                                <p className="text-sm text-gray-500 py-6">No pending join requests.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRequests.map((req) => (
                                        <div key={req.membershipId} className="flex items-center justify-between rounded-xl border border-gray-800/60 bg-[#1f2937]/50 p-4">
                                            <div>
                                                <p className="font-medium text-white">{req.username}</p>
                                                <p className="text-xs text-gray-400">Requested Role: <span className="text-indigo-400">{req.requestedRole}</span></p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRequestAction(req.membershipId, "APPROVED")}
                                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req.membershipId, "REJECTED")}
                                                    className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-600"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                    </div>
                )}
            </main>
        </div>
    );
}