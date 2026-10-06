import { useEffect } from "react";

function Modal({
    isOpen,
    title,
    children,
    onClose,
    confirmText = "Confirm",
    onConfirm,
    showConfirm = false,
    confirmClassName = "bg-blue-600 hover:bg-blue-700",
    confirmDisabled = false,
    confirmFormId,
    closeText = "Cancel",
    closeDisabled = false
}) {
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event) => {
            if (event.key === "Escape" && !closeDisabled) {
                onClose?.();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, closeDisabled, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !closeDisabled) {
                    onClose?.();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">
                        {title}
                    </h2>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        disabled={closeDisabled}
                        className="text-xl text-gray-500 transition hover:text-white disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-5">
                    {children}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-800 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={closeDisabled}
                        className="rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {closeText}
                    </button>

                    {showConfirm && (
                        <button
                            type={confirmFormId ? "submit" : "button"}
                            form={confirmFormId}
                            onClick={confirmFormId ? undefined : onConfirm}
                            disabled={confirmDisabled}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClassName}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Modal;