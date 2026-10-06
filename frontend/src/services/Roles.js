export function getRoleLabel(role) {
    if (role === "OWNER") return "Owner";
    if (role === "VIEWER") return "Viewer";
    return "Member";
}

export function getRoleBadge(role) {
    if (role === "OWNER") return "bg-purple-500/10 text-purple-400";
    if (role === "VIEWER") return "bg-yellow-500/10 text-yellow-400";
    return "bg-blue-500/10 text-blue-400";
}

export function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}