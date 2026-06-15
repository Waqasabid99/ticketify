"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw, ShieldCheck, UserCog, Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
    createUser,
    updateUser,
    updateRole,
    updateStatus,
    deleteUser,
} from "@/actions/user.action";
import {
    DeleteModal,
    EditModal,
    AddModal,
    FormField,
    inputClass,
} from "@/components/ui/Modals";

const emptyAddForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    status: "PENDING",
};

const emptyEditForm = { firstName: "", lastName: "", email: "", phone: "" };
const emptyRoleForm = { role: "CUSTOMER" };
const emptyStatusForm = { status: "PENDING" };

// ─── Badge helpers ────────────────────────────────────────────

const ROLE_STYLES = {
    OWNER: "bg-(--color-yellow-dim)  text-(--color-accent)   border border-(--color-accent)/30",
    MANAGER: "bg-(--color-purple-dim)  text-(--color-info)     border border-(--color-info)/30",
    STAFF: "bg-(--color-green-dim)   text-(--color-success)  border border-(--color-success)/30",
    CUSTOMER: "bg-(--color-bg-surface)  text-(--color-text-muted) border border-(--color-border)",
};

const STATUS_STYLES = {
    ACTIVE: "bg-(--color-green-dim)  text-(--color-success)  border border-(--color-success)/30",
    PENDING: "bg-(--color-yellow-dim) text-(--color-accent)   border border-(--color-accent)/30",
    INACTIVE: "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
    BLOCKED: "bg-(--color-red-dim)    text-(--color-error)    border border-(--color-error)/30",
};

const Badge = ({ value, styleMap }) => (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styleMap[value] ?? styleMap["CUSTOMER"] ?? ""}`}>
        {value?.toLowerCase()}
    </span>
);

// ─── Select helper ────────────────────────────────────────────

const SelectField = ({ label, value, onChange, options }) => (
    <FormField label={label}>
        <select className={inputClass} value={value} onChange={onChange}>
            {options.map((o) => (
                <option key={o} value={o}>
                    {o.charAt(0) + o.slice(1).toLowerCase()}
                </option>
            ))}
        </select>
    </FormField>
);

// ─── Component ────────────────────────────────────────────────

const Users = ({ users = [], pagination = {}, statuses = [], roles = [] }) => {
    const router = useRouter();

    // Modal visibility
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeEditUser, setActiveEditUser] = useState(null);
    const [activeRoleUser, setActiveRoleUser] = useState(null);
    const [activeStatusUser, setActiveStatusUser] = useState(null);
    const [activeDeleteUser, setActiveDeleteUser] = useState(null);

    // Form state
    const [addForm, setAddForm] = useState(emptyAddForm);
    const [editForm, setEditForm] = useState(emptyEditForm);
    const [roleForm, setRoleForm] = useState(emptyRoleForm);
    const [statusForm, setStatusForm] = useState(emptyStatusForm);

    // Loading flags
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isRoling, setIsRoling] = useState(false);
    const [isStatusing, setIsStatusing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Openers ──────────────────────────────────────────────

    const handleOpenEdit = (item) => {
        setEditForm({
            firstName: item.firstName ?? "",
            lastName: item.lastName ?? "",
            email: item.email ?? "",
            phone: item.phone ?? "",
        });
        setActiveEditUser(item);
    };

    const handleOpenRole = (item) => {
        setRoleForm({ role: item.role ?? "CUSTOMER" });
        setActiveRoleUser(item);
    };

    const handleOpenStatus = (item) => {
        setStatusForm({ status: item.status ?? "PENDING" });
        setActiveStatusUser(item);
    };

    // ── Handlers ─────────────────────────────────────────────

    const handleAddUser = async () => {
        setIsAdding(true);
        try {
            const data = await createUser(addForm);
            router.refresh();
            toast.success(data.message ?? "User created successfully");
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
            const data = await updateUser(activeEditUser.id, editForm);
            router.refresh();
            toast.success(data.message ?? "User updated successfully");
            setActiveEditUser(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleSaveRole = async () => {
        setIsRoling(true);
        try {
            const data = await updateRole(activeRoleUser.id, roleForm);
            router.refresh();
            toast.success(data.message ?? "Role updated successfully");
            setActiveRoleUser(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsRoling(false);
        }
    };

    const handleSaveStatus = async () => {
        setIsStatusing(true);
        try {
            const data = await updateStatus(activeStatusUser.id, statusForm);
            router.refresh();
            toast.success(data.message ?? "Status updated successfully");
            setActiveStatusUser(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsStatusing(false);
        }
    };

    const handleDeleteUser = async () => {
        setIsDeleting(true);
        try {
            const data = await deleteUser(activeDeleteUser.id);
            router.refresh();
            toast.success(data.message ?? "User deleted successfully");
            setActiveDeleteUser(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page) => router.push(`?page=${page}`);

    // ── Columns ──────────────────────────────────────────────

    const columns = [
        {
            key: "firstName",
            label: "Name",
            sortable: true,
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-(--color-text-primary)">
                        {val} {row.lastName}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">{row.email}</span>
                </div>
            ),
        },
        {
            key: "phone",
            label: "Phone",
            render: (val) => (
                <span className="text-sm text-(--color-text-secondary)">
                    {val || <span className="text-(--color-text-muted) italic">—</span>}
                </span>
            ),
        },
        {
            key: "role",
            label: "Role",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={ROLE_STYLES} />,
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={STATUS_STYLES} />,
        },
        {
            key: "createdAt",
            label: "Joined",
            sortable: true,
            render: (val) =>
                val ? (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(val).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                ) : "—",
        },
    ];

    // Extra action buttons per row (alongside the default edit/delete)
    const extraActions = (item) => (
        <>
            <button
                title="Change Role"
                onClick={() => handleOpenRole(item)}
                className="p-1.5 rounded text-(--color-info) hover:bg-(--color-purple-dim) transition-colors"
            >
                <ShieldCheck className="w-4 h-4" />
            </button>
            <button
                title="Change Status"
                onClick={() => handleOpenStatus(item)}
                className="p-1.5 rounded text-(--color-accent) hover:bg-(--color-yellow-dim) transition-colors"
            >
                <UserCog className="w-4 h-4" />
            </button>
        </>
    );

    // ── Render ───────────────────────────────────────────────

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Users"
                subHeading="Manage platform users, roles, and access"
                button={
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add User
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
                data={users}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No users found."
                searchPlaceholder="Search users by name or email..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteUser(item)}
                extraActions={extraActions}
            />

            {/* ── Add Modal ─────────────────────────────────── */}
            {showAddModal && (
                <AddModal
                    title="User"
                    onClose={() => { setShowAddModal(false); setAddForm(emptyAddForm); }}
                    onSave={handleAddUser}
                    isAdding={isAdding}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <FormField label="First Name">
                            <input
                                className={inputClass}
                                placeholder="John"
                                value={addForm.firstName}
                                onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                            />
                        </FormField>
                        <FormField label="Last Name">
                            <input
                                className={inputClass}
                                placeholder="Doe"
                                value={addForm.lastName}
                                onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                            />
                        </FormField>
                    </div>
                    <FormField label="Email">
                        <input
                            type="email"
                            className={inputClass}
                            placeholder="john@example.com"
                            value={addForm.email}
                            onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Phone">
                        <input
                            className={inputClass}
                            placeholder="+1 555 000 0000"
                            value={addForm.phone}
                            onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Password">
                        <input
                            type="password"
                            className={inputClass}
                            placeholder="Leave blank for default password"
                            value={addForm.password}
                            onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
                        />
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <SelectField
                            label="Role"
                            value={addForm.role}
                            options={roles}
                            onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))}
                        />
                        <SelectField
                            label="Status"
                            value={addForm.status}
                            options={statuses}
                            onChange={(e) => setAddForm((p) => ({ ...p, status: e.target.value }))}
                        />
                    </div>
                </AddModal>
            )}

            {/* ── Edit Info Modal ───────────────────────────── */}
            {activeEditUser && (
                <EditModal
                    title="User Info"
                    onClose={() => setActiveEditUser(null)}
                    onSave={handleSaveEdit}
                    isEditing={isEditing}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <FormField label="First Name">
                            <input
                                className={inputClass}
                                value={editForm.firstName}
                                onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                            />
                        </FormField>
                        <FormField label="Last Name">
                            <input
                                className={inputClass}
                                value={editForm.lastName}
                                onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                            />
                        </FormField>
                    </div>
                    <FormField label="Email">
                        <input
                            type="email"
                            className={inputClass}
                            value={editForm.email}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Phone">
                        <input
                            className={inputClass}
                            value={editForm.phone}
                            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                        />
                    </FormField>
                </EditModal>
            )}

            {/* ── Change Role Modal ─────────────────────────── */}
            {activeRoleUser && (
                <EditModal
                    title="Change Role"
                    onClose={() => setActiveRoleUser(null)}
                    onSave={handleSaveRole}
                    isEditing={isRoling}
                    saveLabel="Update Role"
                >
                    <p className="text-sm text-(--color-text-secondary) mb-4">
                        Updating role for{" "}
                        <span className="font-semibold text-(--color-text-primary)">
                            {activeRoleUser.firstName} {activeRoleUser.lastName}
                        </span>
                    </p>
                    <SelectField
                        label="Role"
                        value={roleForm.role}
                        options={roles}
                        onChange={(e) => setRoleForm({ role: e.target.value })}
                    />
                </EditModal>
            )}

            {/* ── Change Status Modal ───────────────────────── */}
            {activeStatusUser && (
                <EditModal
                    title="Change Status"
                    onClose={() => setActiveStatusUser(null)}
                    onSave={handleSaveStatus}
                    isEditing={isStatusing}
                    saveLabel="Update Status"
                >
                    <p className="text-sm text-(--color-text-secondary) mb-4">
                        Updating status for{" "}
                        <span className="font-semibold text-(--color-text-primary)">
                            {activeStatusUser.firstName} {activeStatusUser.lastName}
                        </span>
                    </p>
                    <SelectField
                        label="Status"
                        value={statusForm.status}
                        options={statuses}
                        onChange={(e) => setStatusForm({ status: e.target.value })}
                    />
                </EditModal>
            )}

            {/* ── Delete Modal ──────────────────────────────── */}
            {activeDeleteUser && (
                <DeleteModal
                    title="User"
                    item={activeDeleteUser}
                    onClose={() => setActiveDeleteUser(null)}
                    onConfirm={handleDeleteUser}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default Users;
