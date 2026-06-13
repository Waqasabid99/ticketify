"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createGenre, deleteGenre, updateGenre } from "@/actions/genre.action";

const Genres = ({ genre = [], pagination = {} }) => {
    const [genresList, setGenresList] = useState(genre);
    const [activeEditGenre, setActiveEditGenre] = useState(null);
    const [activeDeleteGenre, setActiveDeleteGenre] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const columns = [
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (val) => (
                <span className="font-semibold text-(--color-text-primary)">{val}</span>
            ),
        },
        {
            key: "slug",
            label: "Slug",
            sortable: true,
            render: (val) => (
                <code className="text-xs bg-(--color-purple-dim) text-(--color-info) px-2 py-0.5 rounded font-mono tracking-wide">
                    {val}
                </code>
            ),
        },
        {
            key: "description",
            label: "Description",
            render: (val) => (
                <span className="text-(--color-text-secondary) line-clamp-2 max-w-xs md:max-w-md">
                    {val || (
                        <span className="text-(--color-text-muted) italic">No description</span>
                    )}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (val) => {
                if (!val) return "-";
                return (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(val).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                );
            },
        },
    ];

    const handleAddGenre = async (newGenre) => {
        setIsAdding(true);
        try {
            const data = await createGenre(newGenre);
            toast.success(data.message);
            setGenresList((prev) => [...prev, data.data]);
            setShowAddModal(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async (id, updatedFields) => {
        setIsEditing(true);
        try {
            const data = await updateGenre(id, updatedFields);
            toast.success(data.message);
            setGenresList((prev) => prev.map((g) => (g.id === id ? data.data : g)));
            setActiveEditGenre(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteGenre = async (id) => {
        setIsDeleting(true);
        try {
            const data = await deleteGenre(id);
            toast.success(data.message);
            setGenresList((prev) => prev.filter((g) => g.id !== id));
            setActiveDeleteGenre(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page) => {
        router.push(`?page=${page}`);
    };

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Genres"
                subHeading="Manage movie categories and classifications"
                button={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Genre
                        </button>
                        <button
                            onClick={() => router.refresh()}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                }
            />

            <Table
                columns={columns}
                data={genresList}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No genres found."
                searchPlaceholder="Search genres by name, slug or description..."
                onEdit={(item) => setActiveEditGenre(item)}
                onDelete={(item) => setActiveDeleteGenre(item)}
            />

            {showAddModal && (
                <AddGenreModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddGenre}
                    isAdding={isAdding}
                />
            )}

            {activeEditGenre && (
                <EditGenreModal
                    item={activeEditGenre}
                    onClose={() => setActiveEditGenre(null)}
                    onSave={(updatedFields) => handleSaveEdit(activeEditGenre.id, updatedFields)}
                    isEditing={isEditing}
                />
            )}

            {activeDeleteGenre && (
                <DeleteGenreModal
                    item={activeDeleteGenre}
                    onClose={() => setActiveDeleteGenre(null)}
                    onConfirm={() => handleDeleteGenre(activeDeleteGenre.id)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

// ─── Shared Modal Shell ────────────────────────────────────────────────────────

const ModalShell = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

// ─── Shared Form Field ─────────────────────────────────────────────────────────

const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-(--color-surface-raised) border border-(--color-border-default) text-(--color-text-primary) placeholder-(--color-text-muted) focus:outline-none focus:border-(--color-border-accent) transition-all text-sm";

const FormField = ({ label, children }) => (
    <div>
        <label className="block text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider mb-2">
            {label}
        </label>
        {children}
    </div>
);

// ─── Modals ────────────────────────────────────────────────────────────────────

const AddGenreModal = ({ onClose, onSave, isAdding }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name, description });
    };

    return (
        <ModalShell title="Add Genre" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Name">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Action, Sci-Fi"
                        className={inputClass}
                    />
                </FormField>
                <FormField label="Description">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe the genre..."
                        className={`${inputClass} resize-none`}
                    />
                </FormField>
                <ModalActions onClose={onClose} isLoading={isAdding} label="Create Genre" loadingLabel="Creating..." />
            </form>
        </ModalShell>
    );
};

const EditGenreModal = ({ item, onClose, onSave, isEditing }) => {
    const [name, setName] = useState(item.name);
    const [description, setDescription] = useState(item.description || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name, description });
    };

    return (
        <ModalShell title="Edit Genre" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Name">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={inputClass}
                    />
                </FormField>
                <FormField label="Description">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className={`${inputClass} resize-none`}
                    />
                </FormField>
                <ModalActions onClose={onClose} isLoading={isEditing} label="Save Changes" loadingLabel="Saving..." />
            </form>
        </ModalShell>
    );
};

const DeleteGenreModal = ({ item, onClose, onConfirm, isDeleting }) => (
    <ModalShell title="Delete Genre" onClose={onClose}>
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
                {isDeleting ? "Deleting..." : "Delete Genre"}
            </button>
        </div>
    </ModalShell>
);

// ─── Shared Modal Footer Actions ───────────────────────────────────────────────

const ModalActions = ({ onClose, isLoading, label, loadingLabel }) => (
    <div className="flex justify-end gap-2.5 pt-2">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-sm">
            Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary btn-sm text-sm">
            {isLoading ? loadingLabel : label}
        </button>
    </div>
);

export default Genres;