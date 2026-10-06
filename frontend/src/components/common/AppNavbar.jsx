import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";

function AppNavbar({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <header className="sticky top-0 z-40 h-14 border-b border-gray-800 bg-[#161b22] px-5">
            <div className="mx-auto flex h-full items-center justify-between">
                {/* LEFT */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <button
                        type="button"
                        onClick={() => navigate("/rooms")}
                        className="flex items-center gap-2"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
                            S
                        </div>
                        <span className="text-sm font-semibold text-white">
                            Syncly
                        </span>
                    </button>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => navigate("/rooms")}
                            className={`rounded-md px-3 py-2 text-sm transition ${
                                location.pathname === "/rooms"
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            Rooms
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/requests")}
                            className={`rounded-md px-3 py-2 text-sm transition ${
                                location.pathname === "/requests"
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            My Requests
                        </button>
                    </nav>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <UserMenu onLogout={onLogout} />
                </div>
            </div>
        </header>
    );
}

export default AppNavbar;