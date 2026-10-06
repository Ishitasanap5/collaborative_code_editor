import { apiFetch } from "./api";

export const hasSession = () => Boolean(localStorage.getItem("token"));

export async function readResponseBody(response) {
    const contentType = response.headers.get("content-type") || "";

    try {
        return contentType.includes("application/json")
            ? await response.json()
            : await response.text();
    } catch {
        return null;
    }
}

export function getErrorMessage(data, fallback) {
    if (!data) return fallback;

    if (typeof data === "string") {
        const text = data.trim();
        // ignore HTML error pages / stack traces
        return text && text.length < 200 && !text.startsWith("<")
            ? text
            : fallback;
    }

    if (typeof data.message === "string" && data.message) return data.message;
    if (typeof data.error === "string" && data.error) return data.error;

    if (data.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors).flat()[0];
        if (typeof first === "string") return first;
    }

    return fallback;
}

export async function requestJson(endpoint, options = {}, fallback = "Request failed") {
    const response = await apiFetch(endpoint, options);
    const data = await readResponseBody(response);

    if (!response.ok) {
        let message;

        if (response.status === 401 && !endpoint.startsWith("/api/auth/")) {
            message = "Your session has expired. Please sign in again.";
        } else if (response.status === 403) {
            message = getErrorMessage(
                data,
                "You don't have permission to do that."
            );
        } else {
            message = getErrorMessage(data, fallback);
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return data;
}