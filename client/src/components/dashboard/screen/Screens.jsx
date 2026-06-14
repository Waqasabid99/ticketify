"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw, ChevronRight, Tv2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createScreen, deleteScreen, updateScreen } from "@/actions/screen.action";
import { DeleteModal, EditModal, AddModal, FormField, inputClass } from "@/components/ui/Modals";

const emptyAddForm = {
    name: "",
    type: "",
    seatsPerRow: "",
    rows: "",
    seatType: "",
};

const emptyEditForm = {
    name: "",
    type: "",
};

// ─── Theater Picker ───────────────────────────────────────────────────────────

const TheaterPicker = ({ theaters, onSelect }) => (
    <div className="w-full space-y-6">
        <DashboardBox
            text="Screens"
            subHeading="Select a theater to manage its screens"
        />

        {theaters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Tv2 className="w-10 h-10 text-(--color-text-muted)" />
                <p className="text-(--color-text-secondary) text-sm">
                    No theaters found. Add a theater first before managing screens.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {theaters.map((theater) => (
                    <button
                        key={theater.id}
                        onClick={() => onSelect(theater)}
                        className="group flex items-center justify-between gap-4 p-5 rounded-xl
                                   bg-(--color-surface-raised) border border-(--color-surface-hover)
                                   hover:border-(--color-primary) hover:bg-(--color-surface-hover)
                                   transition-all duration-200 text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-(--color-purple-dim) flex items-center justify-center shrink-0">
                                <Tv2 className="w-5 h-5 text-(--color-info)" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-(--color-text-primary) truncate">
                                    {theater.name}
                                </p>
                                <p className="text-xs text-(--color-text-muted) truncate mt-0.5">
                                    {[theater.city, theater.country].filter(Boolean).join(", ") || "No location"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {theater.isActive !== false ? (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-(--color-success-dim) text-(--color-success)">
                                    Active
                                </span>
                            ) : (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-(--color-error-dim) text-(--color-error)">
                                    Inactive
                                </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-(--color-text-muted) group-hover:text-(--color-primary) transition-colors" />
                        </div>
                    </button>
                ))}
            </div>
        )}
    </div>
);

// ─── Rows Field Help Text ─────────────────────────────────────────────────────

const RowsHelpText = () => (
    <p className="text-xs text-(--color-text-muted) mt-1">
        Enter row labels separated by commas (e.g. <code className="text-(--color-info)">A,B,C</code>)
        or a number for auto-generated rows (e.g. <code className="text-(--color-info)">5</code>).
    </p>
);

// ─── Screen Form Fields (Add) ─────────────────────────────────────────────────

const AddScreenFields = ({ form, setForm, SEAT_TYPES, SCREEN_TYPES }) => (
    <>
        <FormField label="Name">
            <input
                className={inputClass}
                placeholder="e.g. Screen 1 / Auditorium A"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
            <FormField label="Screen Type">
                <select
                    className={inputClass}
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                >
                    <option value="">Select type...</option>
                    {SCREEN_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                </select>
            </FormField>

            <FormField label="Seat Type">
                <select
                    className={inputClass}
                    value={form.seatType}
                    onChange={(e) => setForm((p) => ({ ...p, seatType: e.target.value }))}
                >
                    <option value="">Select type...</option>
                    {SEAT_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                </select>
            </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <FormField label="Seats Per Row">
                <input
                    className={inputClass}
                    type="number"
                    min={1}
                    max={100}
                    placeholder="e.g. 12"
                    value={form.seatsPerRow}
                    onChange={(e) => setForm((p) => ({ ...p, seatsPerRow: e.target.value }))}
                />
            </FormField>

            <FormField label="Rows">
                <input
                    className={inputClass}
                    placeholder="e.g. A,B,C or 5"
                    value={form.rows}
                    onChange={(e) => setForm((p) => ({ ...p, rows: e.target.value }))}
                />
            </FormField>
        </div>
        <RowsHelpText />
    </>
);

// ─── Screen Form Fields (Edit) ────────────────────────────────────────────────

const EditScreenFields = ({ form, setForm, SCREEN_TYPES }) => (
    <>
        <FormField label="Name">
            <input
                className={inputClass}
                placeholder="e.g. Screen 1 / Auditorium A"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
        </FormField>

        <FormField label="Screen Type">
            <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
                <option value="">Select type...</option>
                {SCREEN_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
            </select>
        </FormField>

        <p className="text-xs text-(--color-text-muted) -mt-1">
            Note: seat layout (rows &amp; seats per row) cannot be changed after creation.
        </p>
    </>
);

// ─── Screens Table ────────────────────────────────────────────────────────────

const ScreensTable = ({ theater, screens, pagination, onBack, SEAT_TYPES, SCREEN_TYPES }) => {
    const [activeEditScreen, setActiveEditScreen] = useState(null);
    const [activeDeleteScreen, setActiveDeleteScreen] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(emptyAddForm);
    const [editForm, setEditForm] = useState(emptyEditForm);
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
            key: "type",
            label: "Type",
            render: (val) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-(--color-surface-hover) text-(--color-text-secondary) tracking-wide">
                    {val?.replace("_", " ") ?? "—"}
                </span>
            ),
        },
        {
            key: "capacity",
            label: "Capacity",
            sortable: true,
            render: (val) => (
                <span className="text-sm text-(--color-text-secondary)">
                    {val != null ? `${val} seats` : "—"}
                </span>
            ),
        },
        {
            key: "isActive",
            label: "Status",
            render: (val) => (
                <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${val
                        ? "bg-(--color-success-dim) text-(--color-success)"
                        : "bg-(--color-error-dim) text-(--color-error)"
                        }`}
                >
                    {val ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (val) => {
                if (!val) return "—";
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

    const handleOpenEdit = (item) => {
        setEditForm({ name: item.name ?? "", type: item.type ?? "" });
        setActiveEditScreen(item);
    };

    const parseRows = (rows) => {
        const trimmed = rows.trim();
        // If it's a plain number, pass as number; otherwise pass as comma-split array
        if (/^\d+$/.test(trimmed)) return Number(trimmed);
        return trimmed.split(",").map((r) => r.trim()).filter(Boolean);
    };

    const handleAddScreen = async () => {
        setIsAdding(true);
        try {
            const payload = {
                cinemaId: theater.id,
                name: addForm.name,
                type: addForm.type,
                seatsPerRow: Number(addForm.seatsPerRow),
                rows: parseRows(addForm.rows),
                seatType: addForm.seatType,
            };
            const data = await createScreen(payload);
            router.refresh();
            toast.success(data.message ?? "Screen created successfully");
            setAddForm(emptyAddForm);
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
            const data = await updateScreen(activeEditScreen.id, {
                name: editForm.name,
                type: editForm.type,
            });
            router.refresh();
            toast.success(data.message ?? "Screen updated successfully");
            setActiveEditScreen(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteScreen = async (id) => {
        setIsDeleting(true);
        try {
            const data = await deleteScreen(id);
            router.refresh();
            toast.success(data.message ?? "Screen deleted successfully");
            setActiveDeleteScreen(null);
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
                text={
                    <span className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors text-sm font-normal"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Theaters
                        </button>
                        <span className="text-(--color-text-muted)">/</span>
                        <span>{theater.name}</span>
                    </span>
                }
                subHeading={`Manage screens for ${theater.name}`}
                button={
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Screen
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
                data={screens}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage={`No screens found for ${theater.name}.`}
                searchPlaceholder="Search screens by name, slug or type..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteScreen(item)}
            />

            {showAddModal && (
                <AddModal
                    title="Screen"
                    onClose={() => { setShowAddModal(false); setAddForm(emptyAddForm); }}
                    onSave={handleAddScreen}
                    isAdding={isAdding}
                >
                    <AddScreenFields form={addForm} setForm={setAddForm} SEAT_TYPES={SEAT_TYPES} SCREEN_TYPES={SCREEN_TYPES} />
                </AddModal>
            )}

            {activeEditScreen && (
                <EditModal
                    title="Screen"
                    onClose={() => setActiveEditScreen(null)}
                    onSave={handleSaveEdit}
                    isEditing={isEditing}
                >
                    <EditScreenFields form={editForm} setForm={setEditForm} SCREEN_TYPES={SCREEN_TYPES} />
                </EditModal>
            )}

            {activeDeleteScreen && (
                <DeleteModal
                    title="Screen"
                    item={activeDeleteScreen}
                    onClose={() => setActiveDeleteScreen(null)}
                    onConfirm={() => handleDeleteScreen(activeDeleteScreen.id)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Screens = ({ theaters = [], screens = [], pagination = {}, SEAT_TYPES = [], SCREEN_TYPES = [] }) => {
    const [selectedTheater, setSelectedTheater] = useState(null);

    if (!selectedTheater) {
        return (
            <TheaterPicker
                theaters={theaters}
                onSelect={setSelectedTheater}
            />
        );
    }

    return (
        <ScreensTable
            theater={selectedTheater}
            screens={screens.filter((s) => s.cinemaId === selectedTheater.id)}
            pagination={pagination}
            onBack={() => setSelectedTheater(null)}
            SEAT_TYPES={SEAT_TYPES}
            SCREEN_TYPES={SCREEN_TYPES}
        />
    );
};

export default Screens;
