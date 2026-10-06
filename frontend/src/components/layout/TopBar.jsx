import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../common/NotificationBell";
import UserMenu from "../common/UserMenu";

function TopBar({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isRoomsPage = location.pathname === "/rooms";
    const isRequestsPage = location.pathname === "/requests";

    return (
        <header className="sticky top-0 z-50 h-14 shrink-0 border-b border-gray-800 bg-[#0f1420]">
            <div className="flex h-full items-center justify-between px-5">
                {/* LEFT */}
                <div className="flex items-center gap-6">
                    {/* LOGO */}
                    <button
                        type="button"
                        onClick={() => navigate("/rooms")}
                        className="flex items-center gap-2"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                            S
                        </div>
                        <span className="text-sm font-semibold text-white">
                            Syncly
                        </span>
                    </button>

                    {/* NAVIGATION */}
                    <nav className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => navigate("/rooms")}
                            className={`rounded-md px-3 py-2 text-sm transition ${
                                isRoomsPage
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
                                isRequestsPage
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

export default TopBar;