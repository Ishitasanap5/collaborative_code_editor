import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { apiFetch } from "../services/api";

export default function RequestsPage({ onLogout }) {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [invitations, setInvitations] = useState([]);

    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingInvitations, setLoadingInvitations] = useState(true);

    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        loadRequests();
        loadInvitations();
    }, []);

    async function loadRequests() {
        if (!localStorage.getItem("token")) {
            setLoadingRequests(false);
            return;
        }

        try {
            setLoadingRequests(true);
            const response = await apiFetch("/api/rooms/my/requests");

            if (response.status === 401 || response.status === 403) return;

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Failed to load requests");
            }

            const data = await response.json();
            // Filter to only show pending requests and exclude owner roles
            setRequests(
                Array.isArray(data)
                    ? data.filter(
                          (req) =>
                              (!req.status || req.status === "PENDING") &&
                              req.role !== "OWNER" &&
                              req.requestedRole !== "OWNER"
                      )
                    : []
            );
        } catch (err) {
            console.error("Failed to load requests:", err);
            setError(err.message || "Failed to load requests");
        } finally {
            setLoadingRequests(false);
        }
    }

    async function loadInvitations() {
        if (!localStorage.getItem("token")) {
            setLoadingInvitations(false);
            return;
        }

        try {
            setLoadingInvitations(true);
            const response = await apiFetch("/api/rooms/invitations/my");

            if (response.status === 401 || response.status === 403) return;

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Failed to load invitations");
            }

            const data = await response.json();
            setInvitations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load invitations:", err);
            setError(err.message || "Failed to load invitations");
        } finally {
            setLoadingInvitations(false);
        }
    }

    async function handleInvitationAction(invitationId, action) {
        setProcessingId(invitationId);
        try {
            const response = await apiFetch(
                `/api/rooms/invitations/${invitationId}/${action}`,
                {
                    method: "POST",
                }
            );

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Failed to ${action} invitation`);
            }

            // Refresh list using robust matching
            setInvitations((prev) =>
                prev.filter((inv) => (inv.id ?? inv.invitationId) !== invitationId)
            );
        } catch (err) {
            setError(err.message || `Could not ${action} invitation`);
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">
            <TopBar onLogout={onLogout} />

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Requests & Invitations
                        </h1>
                        <p className="text-sm text-gray-400">
                            Manage your room access requests and invitations.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/rooms")}
                        className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                        Back to Rooms
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* JOIN REQUESTS */}
                    <section className="rounded-2xl border border-gray-800 bg-[#111827] shadow-xl">
                        <div className="border-b border-gray-800 px-6 py-4">
                            <h2 className="font-semibold text-gray-200">
                                Outgoing / Pending Join Requests
                            </h2>
                        </div>
                        <div className="p-4">
                            {loadingRequests ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    Loading requests...
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    No pending join requests.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map((req, index) => {
                                        const reqKey = req.id || req.membershipId || index;
                                        const status = req.status || "PENDING";
                                        
                                        const badgeStyles =
                                            status === "APPROVED"
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : status === "REJECTED"
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-yellow-500/10 text-yellow-400";

                                        return (
                                            <div
                                                key={reqKey}
                                                className="flex items-center justify-between rounded-xl border border-gray-800/60 bg-[#1f2937]/50 p-4"
                                            >
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {req.roomName || "Room"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Requested Role: <span className="text-indigo-400">{req.requestedRole || req.role}</span>
                                                    </p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${badgeStyles}`}>
                                                    {status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* INVITATIONS */}
                    <section className="rounded-2xl border border-gray-800 bg-[#111827] shadow-xl">
                        <div className="border-b border-gray-800 px-6 py-4">
                            <h2 className="font-semibold text-gray-200">
                                Room Invitations
                            </h2>
                        </div>
                        <div className="p-4">
                            {loadingInvitations ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    Loading invitations...
                                </div>
                            ) : invitations.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    No pending invitations.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {invitations.map((inv, index) => {
                                        const invKey = inv.id || inv.invitationId || index;
                                        const targetId = inv.id || inv.invitationId;
                                        return (
                                            <div
                                                key={invKey}
                                                className="flex items-center justify-between rounded-xl border border-gray-800/60 bg-[#1f2937]/50 p-4"
                                            >
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {inv.roomName || "Workspace"}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Invited by: {inv.invitedBy || "Admin"}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={processingId === targetId}
                                                        onClick={() => handleInvitationAction(targetId, "accept")}
                                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        disabled={processingId === targetId}
                                                        onClick={() => handleInvitationAction(targetId, "reject")}
                                                        className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}