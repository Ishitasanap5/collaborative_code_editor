function EditorTopBar({
    document,
    connected,
    activeUsers = [],
    currentClientId,
}) {
    const getInitial = (clientId) => {
        if (clientId === currentClientId) {
            return "Y";
        }

        return (
            clientId
                ?.replace("User-", "")
                .slice(0, 2)
                .toUpperCase() || "?"
        );
    };

    const getDisplayName = (clientId) => {
        if (clientId === currentClientId) {
            return "You";
        }

        return clientId || "Unknown user";
    };

    return (
        <header className="sticky top-0 z-50 h-14 shrink-0 border-b border-gray-800 bg-[#0d1117] px-5">
            <div className="flex h-full items-center justify-between">
                {/* Document */}
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                        S
                    </div>
                    <div className="h-4 w-px bg-gray-700" />
                    <span className="max-w-xs truncate text-sm font-medium text-gray-200">
                        {document?.name || "Untitled Document"}
                    </span>
                </div>

                {/* Collaboration & Status */}
                <div className="flex items-center gap-4">
                    {/* Connection Status */}
                    <div className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1.5">
                        <span
                            className={`h-2 w-2 rounded-full ${
                                connected ? "bg-green-500" : "bg-yellow-500"
                            }`}
                        />
                        <span className="text-xs text-gray-300">
                            {connected ? "Connected" : "Reconnecting..."}
                        </span>
                    </div>

                    {/* Active Collaborators */}
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {activeUsers.slice(0, 4).map((userId) => (
                                <div
                                    key={userId}
                                    title={getDisplayName(userId)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d1117] bg-blue-600 text-xs font-semibold text-white"
                                >
                                    {getInitial(userId)}
                                </div>
                            ))}

                            {activeUsers.length > 4 && (
                                <div
                                    title={`${activeUsers.length - 4} more collaborators`}
                                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d1117] bg-gray-700 text-xs text-gray-300"
                                >
                                    +{activeUsers.length - 4}
                                </div>
                            )}
                        </div>

                        <span className="text-xs text-gray-400">
                            {activeUsers.length}{" "}
                            {activeUsers.length === 1 ? "collaborator" : "collaborators"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default EditorTopBar;