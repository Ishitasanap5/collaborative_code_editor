const API_BASE_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const AUTH_EXPIRED_EVENT = "auth:expired";

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const isAuthEndpoint = endpoint.startsWith("/api/auth/");
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
    };

    if (token && !isAuthEndpoint) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

    
        if (response.status === 401 && !isAuthEndpoint) {
            if (localStorage.getItem("token")) {
                console.warn("🔒 Authentication failed");

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
            }

            return response;
        }

    
        if (response.status === 403) {
            console.warn(`🚫 Access forbidden: ${endpoint}`);
        }

        return response;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
}