"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createGenre, deleteGenre, updateGenre } from "@/actions/genre.action";
import { DeleteModal, EditModal, AddModal, FormField, inputClass } from "@/components/ui/Modals";

const emptyForm = { name: "", description: "" };

const Genres = ({ genre = [], pagination = {} }) => {
    const [activeEditGenre, setActiveEditGenre] = useState(null);
    const [activeDeleteGenre, setActiveDeleteGenre] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(emptyForm);
    const [editForm, setEditForm] = useState(emptyForm);
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

    // Sync edit form when a genre is selected for editing
    const handleOpenEdit = (item) => {
        setEditForm({ name: item.name ?? "", description: item.description ?? "" });
        setActiveEditGenre(item);
    };

    const handleAddGenre = async () => {
        setIsAdding(true);
        try {
            const data = await createGenre(addForm);
            router.refresh();
            toast.success(data.message);
            setAddForm(emptyForm);
            setShowAddModal(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async () => {
        setIsEditing(true);
        try {
            const data = await updateGenre(activeEditGenre.id, editForm);
            router.refresh();
            toast.success(data.message);
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
            router.refresh();
            toast.success(data.message);
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
                    <div className="flex flex-wrap gap-2">
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
                data={genre}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No genres found."
                searchPlaceholder="Search genres by name, slug or description..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteGenre(item)}
            />

            {showAddModal && (
                <AddModal
                    title="Genre"
                    onClose={() => { setShowAddModal(false); setAddForm(emptyForm); }}
                    onSave={handleAddGenre}
                    isAdding={isAdding}
                >
                    <FormField label="Name">
                        <input
                            className={inputClass}
                            placeholder="e.g. Science Fiction"
                            value={addForm.name}
                            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Description">
                        <textarea
                            className={`${inputClass} resize-none`}
                            rows={3}
                            placeholder="Optional description..."
                            value={addForm.description}
                            onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                        />
                    </FormField>
                </AddModal>
            )}

            {activeEditGenre && (
                <EditModal
                    title="Genre"
                    onClose={() => setActiveEditGenre(null)}
                    onSave={handleSaveEdit}
                    isEditing={isEditing}
                >
                    <FormField label="Name">
                        <input
                            className={inputClass}
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Description">
                        <textarea
                            className={`${inputClass} resize-none`}
                            rows={3}
                            value={editForm.description}
                            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        />
                    </FormField>
                </EditModal>
            )}

            {activeDeleteGenre && (
                <DeleteModal
                    title="Genre"
                    item={activeDeleteGenre}
                    onClose={() => setActiveDeleteGenre(null)}
                    onConfirm={() => handleDeleteGenre(activeDeleteGenre.id)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default Genres;
