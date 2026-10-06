import { useState } from "react";

function Sidebar({
    snapshots = [],
    loadingSnapshots = false,
    onRestoreSnapshot
}) {
    const [checkpointsExpanded, setCheckpointsExpanded] = useState(false);

    return (
        <aside className="w-60 shrink-0 border-r border-gray-800 bg-[#0d1117]">
            {/* Explorer Header */}
            <div className="border-b border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Explorer
                    </span>
                    <button type="button" className="text-gray-400 hover:text-white">
                        +
                    </button>
                </div>
            </div>

            <div className="p-2">
                {/* PROJECT */}
                <div className="mb-2 px-2 text-xs text-gray-500">
                    PROJECT
                </div>

                <div className="space-y-1">
                    <div className="flex cursor-pointer items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm">
                        <span>📄</span>
                        <span>Main.java</span>
                    </div>

                    <div className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
                        <span>📄</span>
                        <span>Test.java</span>
                    </div>
                </div>

                {/* CHECKPOINTS */}
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setCheckpointsExpanded(!checkpointsExpanded)}
                        className="flex w-full items-center gap-1 rounded px-2 py-2 text-left text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    >
                        <span className="text-[10px]">
                            {checkpointsExpanded ? "▼" : "▶"}
                        </span>
                        <span className="font-semibold">
                            CHECKPOINTS
                        </span>
                    </button>

                    {/* EXPANDED CHECKPOINTS */}
                    {checkpointsExpanded && (
                        <div className="mt-1 space-y-1">
                            {loadingSnapshots && (
                                <div className="px-4 py-2 text-xs text-gray-500">
                                    Loading checkpoints...
                                </div>
                            )}

                            {!loadingSnapshots && snapshots.length === 0 && (
                                <div className="px-4 py-2 text-xs text-gray-500">
                                    No checkpoints yet
                                </div>
                            )}

                            {!loadingSnapshots &&
                                snapshots.map((snapshot) => (
                                    <div
                                        key={snapshot.id}
                                        onClick={() => onRestoreSnapshot(snapshot.id)}
                                        className="cursor-pointer rounded-md px-4 py-2 hover:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <span className="text-gray-500">◷</span>
                                            <span>Checkpoint #{snapshot.id}</span>
                                        </div>

                                        <div className="ml-5 mt-1 text-xs text-gray-500">
                                            {new Date(snapshot.createdAt).toLocaleString()}
                                        </div>

                                        <div className="ml-5 text-xs text-gray-500">
                                            by {snapshot.createdBy}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;