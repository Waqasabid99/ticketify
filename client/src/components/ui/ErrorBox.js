import { AlertCircle, X } from "lucide-react";

export const ErrorBox = ({ error, onClose, onCloseItem, title, className = "" }) => {
    if (!error || (Array.isArray(error) && error.length === 0)) return null;

    const errors = Array.isArray(error) ? error : [error];
    const isMulti = errors.length > 0;
    const heading = title ?? (isMulti ? "Please fix the following:" : "Something went wrong");

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`
                w-full rounded-md border border-(--color-danger)
                bg-(--color-bg-danger) text-(--color-danger)
                ${className}
            `}
        >
            {/* ── Header row ── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <AlertCircle
                        size={16}
                        className="shrink-0 text-(--color-danger)"
                        aria-hidden="true"
                    />
                    <p className="text-sm leading-snug text-(--color-danger) font-(--font-body)">
                        {heading}
                    </p>
                </div>

                {/* Global dismiss */}
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Dismiss all errors"
                        className="
                            shrink-0 p-0.5 rounded-sm
                            text-(--color-danger) opacity-70
                            hover:opacity-100 hover:bg-(--color-danger)/15
                            transition-opacity duration-150 cursor-pointer
                        "
                    >
                        <X size={15} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* ── Error list (only rendered when multi OR single with list style) ── */}
            {isMulti && (
                <>
                    <div className="h-px bg-(--color-danger)/20 mx-4" />
                    <ul className="px-4 py-2.5 flex flex-col gap-1.5" role="list">
                        {errors.map((msg, i) => (
                            <li
                                key={i}
                                className="flex items-start justify-between gap-2"
                            >
                                <div className="flex items-start gap-2 min-w-0">
                                    <span
                                        className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-(--color-danger) opacity-60"
                                        aria-hidden="true"
                                    />
                                    <span className="text-sm leading-relaxed text-(--color-danger)/85 font-(--font-body) wrap-break-word">
                                        {msg}
                                    </span>
                                </div>

                                {/* Per-item dismiss */}
                                {onCloseItem && (
                                    <button
                                        onClick={() => onCloseItem(i)}
                                        aria-label={`Dismiss: ${msg}`}
                                        className="
                                            shrink-0 mt-0.5 p-0.5 rounded-sm
                                            text-(--color-danger) opacity-50
                                            hover:opacity-100 hover:bg-(--color-danger)/15
                                            transition-opacity duration-150 cursor-pointer
                                        "
                                    >
                                        <X size={13} aria-hidden="true" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};
