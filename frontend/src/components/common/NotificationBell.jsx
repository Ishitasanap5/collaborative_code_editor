import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/api";

const POLL_MS = 15000;

async function markRead(id) {
    try {
        const response = await apiFetch(`/api/notifications/${id}/read`, {
            method: "PUT"
        });
        return response.ok;
    } catch (error) {
        console.warn("Could not mark notification as read:", error);
        return false;
    }
}

function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const mountedRef = useRef(true);
    const tokenRef = useRef(localStorage.getItem("token"));
    const loadedOnceRef = useRef(false);

    const loadNotifications = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (tokenRef.current !== token) {
            tokenRef.current = token;
            loadedOnceRef.current = false;
            setNotifications([]);
        }

        if (!token) {
            return;
        }

        try {
            if (!loadedOnceRef.current) {
                setLoading(true);
            }

            const response = await apiFetch("/api/notifications");

            if (!mountedRef.current || tokenRef.current !== token) {
                return;
            }

            if (response.status === 401 || response.status === 403) {
                setNotifications([]);
                return;
            }

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (!mountedRef.current || tokenRef.current !== token) {
                return;
            }

            loadedOnceRef.current = true;
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.warn("Could not load notifications:", error);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        loadNotifications();

        const intervalId = setInterval(() => {
            if (!document.hidden) {
                loadNotifications();
            }
        }, POLL_MS);

        const onVisibilityChange = () => {
            if (!document.hidden) {
                loadNotifications();
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            mountedRef.current = false;
            clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [loadNotifications]);

    useEffect(() => {
        if (open) {
            loadNotifications();
        }
    }, [open, loadNotifications]);

    async function markAsRead(notification) {
        if (notification.read) {
            return;
        }

        if (!(await markRead(notification.id))) {
            return;
        }

        setNotifications((previous) =>
            previous.map((item) =>
                item.id === notification.id
                    ? { ...item, read: true }
                    : item
            )
        );
    }

    async function markAllAsRead() {
        const ids = notifications
            .filter((notification) => !notification.read)
            .map((notification) => notification.id);

        const results = await Promise.all(
            ids.map(async (id) => ((await markRead(id)) ? id : null))
        );

        const done = new Set(results.filter((id) => id !== null));

        setNotifications((previous) =>
            previous.map((item) =>
                done.has(item.id) ? { ...item, read: true } : item
            )
        );
    }

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    return (
        <div className="relative">
            <button
                type="button"
                aria-label="Notifications"
                onClick={() => setOpen((previous) => !previous)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-white"
            >
                <span className="text-lg">🔔</span>

                {unreadCount > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />

                    <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-700 bg-[#161b22] shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
                            <h3 className="text-sm font-semibold text-white">
                                Notifications
                            </h3>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading && notifications.length === 0 && (
                                <div className="px-4 py-6 text-center text-sm text-gray-500">
                                    Loading...
                                </div>
                            )}

                            {!loading && notifications.length === 0 && (
                                <div className="px-4 py-8 text-center text-sm text-gray-500">
                                    No notifications
                                </div>
                            )}

                            {notifications.map((notification) => (
                                <button
                                    type="button"
                                    key={notification.id}
                                    onClick={() => markAsRead(notification)}
                                    className={`block w-full border-b border-gray-800 px-4 py-3 text-left transition hover:bg-gray-800 ${
                                        notification.read ? "" : "bg-blue-500/5"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                                notification.read
                                                    ? "bg-gray-700"
                                                    : "bg-blue-500"
                                            }`}
                                        />

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-200">
                                                {notification.title}
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-gray-500">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default NotificationBell;