import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate,
} from "react-router-dom";
import { useState } from "react";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoomsPage from "./pages/RoomsPage";
import RoomPage from "./pages/RoomPage";
import RequestsPage from "./pages/RequestsPage";
import EditorPage from "./pages/EditorPage";
function AppContent() {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");

            if (!storedUser) {
                return null;
            }

            return JSON.parse(storedUser);
        } catch {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return null;
        }
    });

    function handleLogin(loginData) {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData));

        setUser(loginData);

        navigate("/rooms", {
            replace: true,
        });
    }

   function handleLogout() {
    console.log("=== LOGOUT CLICKED ===");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    console.log("Token after removal:", localStorage.getItem("token"));
    console.log("User after removal:", localStorage.getItem("user"));

    window.location.href = "/";
}

    return (
        <Routes>
            {/* ========================= */}
            {/* PUBLIC LANDING PAGE */}
            {/* ========================= */}

            <Route
                path="/"
                element={<LandingPage />}
            />

            {/* ========================= */}
            {/* LOGIN */}
            {/* ========================= */}

            <Route
                path="/login"
                element={
                    user ? (
                        <Navigate
                            to="/rooms"
                            replace
                        />
                    ) : (
                        <LoginPage
                            onLogin={handleLogin}
                        />
                    )
                }
            />

            {/* ========================= */}
            {/* REGISTER */}
            {/* ========================= */}

            <Route
                path="/register"
                element={
                    user ? (
                        <Navigate
                            to="/rooms"
                            replace
                        />
                    ) : (
                        <RegisterPage
                            onRegistered={handleLogin}
                        />
                    )
                }
            />

            {/* ========================= */}
            {/* ROOMS */}
            {/* ========================= */}

            <Route
                path="/rooms"
                element={
                    user ? (
                        <RoomsPage
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Navigate
                            to="/login"
                            replace
                        />
                    )
                }
            />

            {/* ========================= */}
            {/* ROOM */}
            {/* ========================= */}

            <Route
                path="/rooms/:roomId"
                element={
                    user ? (
                        <RoomPage
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Navigate
                            to="/login"
                            replace
                        />
                    )
                }
            />

            {/* ========================= */}
            {/* JOIN REQUESTS */}
            {/* ========================= */}

            <Route
                path="/requests"
                element={
                    user ? (
                        <RequestsPage
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Navigate
                            to="/login"
                            replace
                        />
                    )
                }
            />
            
            {/* ========================= */}
            {/* EDITOR */}
            {/* ========================= */}

            <Route
                path="/editor/:documentId"
                element={
                    user ? (
                        <EditorPage
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Navigate
                            to="/login"
                            replace
                        />
                    )
                }
            />

            {/* ========================= */}
            {/* UNKNOWN ROUTES */}
            {/* ========================= */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;