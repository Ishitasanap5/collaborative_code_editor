import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, saveSession } from "../services/authService";

function RegisterPage({ onRegistered }) {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await registerUser(username, email, password);

            if (!saveSession(data)) {
                throw new Error("Invalid session data received from server");
            }

            if (typeof onRegistered === "function") {
                onRegistered(data);
            }

            navigate("/rooms");
        } catch (error) {
            setError(error.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0d1117] px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#161b22] p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-500/20">
                        S
                    </div>

                    <h1 className="text-2xl font-bold text-white">
                        Create your account
                    </h1>

                    <p className="mt-2 text-sm text-gray-400">
                        Start collaborating with Syncly
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            autoComplete="username"
                            className="w-full rounded-lg border border-gray-700 bg-[#0d1117] px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-700 bg-[#0d1117] px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            placeholder="Enter email"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-700 bg-[#0d1117] px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            placeholder="Create password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <div className="mt-6 border-t border-gray-800 pt-6 text-center">
                    <p className="text-sm text-gray-400">
                        Already have an account?
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;