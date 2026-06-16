"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
    createCoupon,
    updateCoupon,
    updateCouponStatus,
    deleteCoupon,
    getCouponUsages,
} from "@/actions/coupon.action";
import {
    DeleteModal,
    EditModal,
    AddModal,
    FormField,
    inputClass,
} from "@/components/ui/Modals";

// ─── Empty form defaults ───────────────────────────────────────

const emptyAddForm = {
    code: "",
    type: "PERCENTAGE",
    value: "",
    maxUses: "",
    startsAt: "",
    expiresAt: "",
    isActive: true,
};

const emptyEditForm = {
    code: "",
    type: "PERCENTAGE",
    value: "",
    maxUses: "",
    startsAt: "",
    expiresAt: "",
};

// ─── Badge helpers ─────────────────────────────────────────────

const TYPE_STYLES = {
    PERCENTAGE: "bg-(--color-purple-dim) text-(--color-info) border border-(--color-info)/30",
    FLAT: "bg-(--color-yellow-dim) text-(--color-accent) border border-(--color-accent)/30",
};

const STATUS_STYLES = {
    true: "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
    false: "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
};

const Badge = ({ value, styleMap, label }) => (
    <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styleMap[String(value)] ?? ""
            }`}
    >
        {label}
    </span>
);

// ─── Coupon Usages Modal ───────────────────────────────────────

const UsagesModal = ({ coupon, usages, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border)">
                <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                        Usages — {coupon.code}
                    </h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                        {usages.length} of {coupon.maxUses} uses
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors text-xl leading-none"
                >
                    ×
                </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                {usages.length === 0 ? (
                    <p className="text-sm text-(--color-text-muted) italic text-center py-8">
                        No usages yet for this coupon.
                    </p>
                ) : (
                    usages.map((u, i) => (
                        <div
                            key={u.id ?? i}
                            className="flex items-center justify-between rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3"
                        >
                            <div>
                                <p className="text-sm font-medium text-(--color-text-primary)">
                                    {u.booking?.id
                                        ? `Booking #${u.booking.id.slice(0, 8)}…`
                                        : "—"}
                                </p>
                                <p className="text-xs text-(--color-text-muted) mt-0.5">
                                    User ID: {u.userId?.slice(0, 8)}…
                                </p>
                            </div>
                            <span className="text-xs text-(--color-text-muted)">
                                {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "—"}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);

// ─── Helpers ───────────────────────────────────────────────────

// Convert ISO string → datetime-local input value
const toDatetimeLocal = (iso) => {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 16);
};

// Convert datetime-local input value → ISO string
const fromDatetimeLocal = (val) => (val ? new Date(val).toISOString() : "");

// ─── Component ─────────────────────────────────────────────────

const Coupons = ({ coupons = [], pagination = {}, couponTypes = ["PERCENTAGE", "FLAT"] }) => {
    const router = useRouter();

    // Modal visibility
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeEditCoupon, setActiveEditCoupon] = useState(null);
    const [activeDeleteCoupon, setActiveDeleteCoupon] = useState(null);
    const [activeStatusCoupon, setActiveStatusCoupon] = useState(null);
    const [activeUsagesCoupon, setActiveUsagesCoupon] = useState(null);
    const [usages, setUsages] = useState([]);
    const [isLoadingUsages, setIsLoadingUsages] = useState(false);

    // Form state
    const [addForm, setAddForm] = useState(emptyAddForm);
    const [editForm, setEditForm] = useState(emptyEditForm);

    // Loading flags
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isStatusing, setIsStatusing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Openers ───────────────────────────────────────────────

    const handleOpenEdit = (item) => {
        setEditForm({
            code: item.code ?? "",
            type: item.type ?? "PERCENTAGE",
            value: item.value ?? "",
            maxUses: item.maxUses ?? "",
            startsAt: toDatetimeLocal(item.startsAt),
            expiresAt: toDatetimeLocal(item.expiresAt),
        });
        setActiveEditCoupon(item);
    };

    const handleOpenUsages = async (item) => {
        setActiveUsagesCoupon(item);
        setIsLoadingUsages(true);
        try {
            const data = await getCouponUsages(item.id);
            setUsages(Array.isArray(data) ? data : []);
        } catch {
            setUsages([]);
        } finally {
            setIsLoadingUsages(false);
        }
    };

    // ── Handlers ──────────────────────────────────────────────

    const handleAddCoupon = async () => {
        setIsAdding(true);
        try {
            await createCoupon({
                ...addForm,
                startsAt: fromDatetimeLocal(addForm.startsAt),
                expiresAt: fromDatetimeLocal(addForm.expiresAt),
            });
            router.refresh();
            toast.success("Coupon created successfully");
            setAddForm(emptyAddForm);
            setShowAddModal(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async () => {
        setIsEditing(true);
        try {
            await updateCoupon({
                couponId: activeEditCoupon.id,
                ...editForm,
                startsAt: fromDatetimeLocal(editForm.startsAt),
                expiresAt: fromDatetimeLocal(editForm.expiresAt),
            });
            router.refresh();
            toast.success("Coupon updated successfully");
            setActiveEditCoupon(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleToggleStatus = async (item) => {
        setActiveStatusCoupon(item);
        setIsStatusing(true);
        try {
            await updateCouponStatus({ couponId: item.id, isActive: !item.isActive });
            router.refresh();
            toast.success(`Coupon ${!item.isActive ? "activated" : "deactivated"} successfully`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsStatusing(false);
            setActiveStatusCoupon(null);
        }
    };

    const handleDeleteCoupon = async () => {
        setIsDeleting(true);
        try {
            await deleteCoupon(activeDeleteCoupon.id);
            router.refresh();
            toast.success("Coupon deleted successfully");
            setActiveDeleteCoupon(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page) => router.push(`?page=${page}`);

    // ── Columns ───────────────────────────────────────────────

    const columns = [
        {
            key: "code",
            label: "Code",
            sortable: true,
            render: (val) => (
                <span className="font-mono font-semibold tracking-widest text-sm text-(--color-accent)">
                    {val}
                </span>
            ),
        },
        {
            key: "type",
            label: "Type",
            sortable: true,
            render: (val) => (
                <Badge
                    value={val}
                    styleMap={TYPE_STYLES}
                    label={val === "PERCENTAGE" ? "%" : "Flat"}
                />
            ),
        },
        {
            key: "value",
            label: "Value",
            render: (val, row) => (
                <span className="text-sm font-semibold text-(--color-text-primary)">
                    {row.type === "PERCENTAGE" ? `${val}%` : `$${Number(val).toFixed(2)}`}
                </span>
            ),
        },
        {
            key: "maxUses",
            label: "Uses",
            render: (val, row) => {
                const usedCount = row._count?.couponUsages ?? row.usedCount ?? "—";
                return (
                    <span className="text-sm text-(--color-text-secondary)">
                        <span className="text-(--color-text-primary) font-medium">{usedCount}</span>
                        {" / "}
                        {val}
                    </span>
                );
            },
        },
        {
            key: "startsAt",
            label: "Starts",
            render: (val) =>
                val ? (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(val).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                ) : (
                    "—"
                ),
        },
        {
            key: "expiresAt",
            label: "Expires",
            sortable: true,
            render: (val) => {
                if (!val) return "—";
                const expired = new Date(val) < new Date();
                return (
                    <span
                        className={`text-xs ${expired
                                ? "text-(--color-error) font-semibold"
                                : "text-(--color-text-muted)"
                            }`}
                    >
                        {new Date(val).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                );
            },
        },
        {
            key: "isActive",
            label: "Status",
            sortable: true,
            render: (val) => (
                <Badge
                    value={val}
                    styleMap={STATUS_STYLES}
                    label={val ? "Active" : "Inactive"}
                />
            ),
        },
    ];

    const extraActions = (item) => (
        <>
            {/* View usages */}
            <button
                title="View Usages"
                onClick={() => handleOpenUsages(item)}
                className="p-1.5 rounded text-(--color-info) hover:bg-(--color-purple-dim) transition-colors"
            >
                <Eye className="w-4 h-4" />
            </button>

            {/* Toggle active */}
            <button
                title={item.isActive ? "Deactivate" : "Activate"}
                onClick={() => handleToggleStatus(item)}
                disabled={activeStatusCoupon?.id === item.id && isStatusing}
                className={`p-1.5 rounded transition-colors disabled:opacity-50 ${item.isActive
                        ? "text-(--color-success) hover:bg-(--color-green-dim)"
                        : "text-(--color-text-muted) hover:bg-(--color-bg-surface)"
                    }`}
            >
                {item.isActive ? (
                    <ToggleRight className="w-4 h-4" />
                ) : (
                    <ToggleLeft className="w-4 h-4" />
                )}
            </button>
        </>
    );

    // ── Shared form fields renderer ────────────────────────────

    const renderCouponFields = (form, setForm) => (
        <>
            <FormField label="Coupon Code">
                <input
                    className={`${inputClass} uppercase tracking-widest`}
                    placeholder="e.g. SUMMER20"
                    value={form.code}
                    onChange={(e) =>
                        setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                    }
                />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormField label="Type">
                    <select
                        className={inputClass}
                        value={form.type}
                        onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    >
                        {couponTypes.map((t) => (
                            <option key={t} value={t}>
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label={form.type === "PERCENTAGE" ? "Discount (%)" : "Discount ($)"}>
                    <input
                        type="number"
                        min="0"
                        className={inputClass}
                        placeholder={form.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 5.00"}
                        value={form.value}
                        onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                    />
                </FormField>
            </div>

            <FormField label="Max Uses">
                <input
                    type="number"
                    min="1"
                    className={inputClass}
                    placeholder="e.g. 100"
                    value={form.maxUses}
                    onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormField label="Starts At">
                    <input
                        type="datetime-local"
                        className={inputClass}
                        value={form.startsAt}
                        onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                    />
                </FormField>

                <FormField label="Expires At">
                    <input
                        type="datetime-local"
                        className={inputClass}
                        value={form.expiresAt}
                        onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                    />
                </FormField>
            </div>
        </>
    );

    // ── Render ────────────────────────────────────────────────

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Coupons"
                subHeading="Create and manage discount coupons for bookings"
                button={
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Coupon
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
                data={coupons}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No coupons found."
                searchPlaceholder="Search coupons by code..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteCoupon(item)}
                extraActions={extraActions}
            />

            {/* ── Add Modal ──────────────────────────────────── */}
            {showAddModal && (
                <AddModal
                    title="Coupon"
                    onClose={() => {
                        setShowAddModal(false);
                        setAddForm(emptyAddForm);
                    }}
                    onSave={handleAddCoupon}
                    isAdding={isAdding}
                >
                    {renderCouponFields(addForm, setAddForm)}

                    {/* isActive toggle only on create */}
                    <FormField label="Active on Creation">
                        <label className="flex items-center gap-3 cursor-pointer mt-1">
                            <div
                                onClick={() =>
                                    setAddForm((p) => ({ ...p, isActive: !p.isActive }))
                                }
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${addForm.isActive
                                        ? "bg-(--color-success)"
                                        : "bg-(--color-border)"
                                    }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${addForm.isActive ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </div>
                            <span className="text-sm text-(--color-text-secondary)">
                                {addForm.isActive ? "Coupon will be active" : "Coupon will be inactive"}
                            </span>
                        </label>
                    </FormField>
                </AddModal>
            )}

            {/* ── Edit Modal ─────────────────────────────────── */}
            {activeEditCoupon && (
                <EditModal
                    title="Edit Coupon"
                    onClose={() => setActiveEditCoupon(null)}
                    onSave={handleSaveEdit}
                    isEditing={isEditing}
                >
                    {renderCouponFields(editForm, setEditForm)}
                </EditModal>
            )}

            {/* ── Delete Modal ───────────────────────────────── */}
            {activeDeleteCoupon && (
                <DeleteModal
                    title="Coupon"
                    item={activeDeleteCoupon}
                    onClose={() => setActiveDeleteCoupon(null)}
                    onConfirm={handleDeleteCoupon}
                    isDeleting={isDeleting}
                />
            )}

            {/* ── Usages Modal ───────────────────────────────── */}
            {activeUsagesCoupon && (
                <UsagesModal
                    coupon={activeUsagesCoupon}
                    usages={isLoadingUsages ? [] : usages}
                    onClose={() => {
                        setActiveUsagesCoupon(null);
                        setUsages([]);
                    }}
                />
            )}
        </div>
    );
};

export default Coupons;
