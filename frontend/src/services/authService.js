import { requestJson } from "./Http";

export function registerUser(username, email, password) {
    return requestJson(
        "/api/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                username: username.trim(),
                email: email.trim(),
                password
            })
        },
        "Registration failed"
    );
}

export function loginUser(email, password) {
    return requestJson(
        "/api/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email: email.trim(),
                password
            })
        },
        "Login failed"
    );
}

export function saveSession(data) {
    if (!data || typeof data !== "object" || !data.token) {
        return false;
    }

    localStorage.setItem("token", data.token);

    localStorage.setItem(
        "user",
        JSON.stringify({
            userId: data.userId ?? data.id,
            username: data.username,
            email: data.email
        })
    );

    return true;
}