import { X } from "lucide-react";

const ModalShell = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-600 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-(--color-bg-surface) border border-(--color-border-default) rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
                onClick={onClose}
                className="absolute right-4 top-4 text-(--color-text-muted) hover:text-(--color-text-primary) p-1 rounded-lg hover:bg-(--color-surface-hover) transition-all"
            >
                <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-(--color-text-primary)">{title}</h3>
            {children}
        </div>
    </div>
);

export const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-(--color-surface-raised) border border-(--color-border-default) text-(--color-text-primary) placeholder-(--color-text-muted) focus:outline-none focus:border-(--color-border-accent) transition-all text-sm";

export const FormField = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider mb-2">
            {label}
        </label>
        {children}
    </div>
);

export const ModalActions = ({ onClose, confirmLabel, loadingLabel, isLoading, danger = false }) => (
    <div className="flex justify-end gap-2.5 mt-5">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-sm">
            Cancel
        </button>
        <button
            type="button"
            onClick={onClose} // overridden by parent via form submit pattern — see usage
            disabled={isLoading}
            className={`btn btn-sm text-sm ${danger ? "btn-danger" : "btn-primary"}`}
        >
            {isLoading ? loadingLabel : confirmLabel}
        </button>
    </div>
);

export const DeleteModal = ({ title, item, onClose, onConfirm, isDeleting }) => (
    <ModalShell title={`Delete ${title}`} onClose={onClose}>
        <p className="text-sm text-(--color-text-secondary) mb-5">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-(--color-text-primary)">{item.name}</span>?
            This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-sm">
                Cancel
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="btn btn-danger btn-sm text-sm"
            >
                {isDeleting ? "Deleting..." : `Delete ${title}`}
            </button>
        </div>
    </ModalShell>
);

export const AddModal = ({ title, onClose, onSave, isAdding, children }) => (
    <ModalShell title={`Add ${title}`} onClose={onClose}>
        <div className="space-y-4 mb-5">{children}</div>
        <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-sm">
                Cancel
            </button>
            <button
                type="button"
                onClick={onSave}
                disabled={isAdding}
                className="btn btn-primary btn-sm text-sm"
            >
                {isAdding ? "Adding..." : `Add ${title}`}
            </button>
        </div>
    </ModalShell>
);

export const EditModal = ({ title, onClose, onSave, isEditing, children }) => (
    <ModalShell title={`Edit ${title}`} onClose={onClose}>
        <div className="space-y-4 mb-5">{children}</div>
        <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-sm">
                Cancel
            </button>
            <button
                type="button"
                onClick={onSave}
                disabled={isEditing}
                className="btn btn-primary btn-sm text-sm"
            >
                {isEditing ? "Saving..." : `Save ${title}`}
            </button>
        </div>
    </ModalShell>
);
