import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function readStoredUser() {
    try {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function UserMenu({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState(readStoredUser);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setUser(readStoredUser());
    }, [location.pathname]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    const username = user?.username || user?.name || user?.email || "User";

    function go(path) {
        setOpen(false);
        navigate(path);
    }

    function handleLogout() {
        setOpen(false);
        if (typeof onLogout === "function") {
            onLogout();
        }
    }

    function handleSwitchAccount() {
        setOpen(false);

        if (typeof onLogout === "function") {
            onLogout();
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    }

    return (
        <div className="relative">
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((previous) => !previous)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-gray-800"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {username.charAt(0).toUpperCase()}
                </div>

                <span className="max-w-32 truncate text-sm text-gray-300">
                    {username}
                </span>

                <span className="text-xs text-gray-500">▾</span>
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />

                    <div
                        role="menu"
                        className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-700 bg-[#161b22] shadow-xl"
                    >
                        <div className="border-b border-gray-700 px-4 py-3">
                            <p className="text-sm font-medium text-white">
                                {username}
                            </p>

                            <p className="mt-1 truncate text-xs text-gray-500">
                                {user?.email || ""}
                            </p>
                        </div>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => go("/rooms")}
                            className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
                        >
                            My Rooms
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => go("/requests")}
                            className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
                        >
                            My Requests
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleSwitchAccount}
                            className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
                        >
                            Switch Account
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            className="block w-full border-t border-gray-700 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-gray-800 hover:text-red-300"
                        >
                            Logout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default UserMenu;