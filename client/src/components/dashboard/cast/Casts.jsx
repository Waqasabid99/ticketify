"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
    Users,
    Pencil,
    Trash2,
    Plus,
    Search,
    X,
    ChevronRight,
    Loader2,
    RefreshCcw,
} from "lucide-react";
import DashboardBox from "@/components/ui/DashboardBox";
import {
    getCast,
    addCast,
    updateCast,
    removeCastMember,
} from "@/actions/cast.action";
import { useRouter } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIALS = (name) =>
    name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

const ACCENT_CLASSES = [
    "bg-(--color-accent)",
    "bg-(--color-info)",
    "bg-(--color-warning)",
    "bg-(--color-success)",
    "bg-(--color-purple-bright)",
];

const avatarAccent = (id) =>
    ACCENT_CLASSES[(id?.charCodeAt(0) ?? 0) % ACCENT_CLASSES.length];

const ROLE_BADGE_MAP = {
    LEAD_ACTOR: "badge-accent",
    SUPPORTING_ACTOR: "badge-success",
    DIRECTOR: "badge-info",
    PRODUCER: "badge-muted",
    SCREENPLAY: "badge-warning",
    CINEMATOGRAPHER: "badge-muted",
    EDITOR: "badge-muted",
    COMPOSER: "badge-muted",
};

const formatRole = (role) =>
    role
        .split("_")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");

// ─── Sub-components ───────────────────────────────────────────────────────────

function CastAvatar({ member, size = 48 }) {
    return (
        <div
            className={`${avatarAccent(member.id)} rounded-full flex items-center justify-center flex-shrink-0 font-bold`}
            style={{
                width: size,
                height: size,
                fontSize: size * 0.32,
                color: "var(--color-accent-text)",
                fontFamily: "var(--font-display)",
            }}
        >
            {INITIALS(member.name)}
        </div>
    );
}

function RoleBadge({ role }) {
    return (
        <span className={`badge ${ROLE_BADGE_MAP[role] ?? "badge-muted"}`}>
            {formatRole(role)}
        </span>
    );
}

function CastCard({ member, onEdit, onDelete, isDeleting }) {
    return (
        <div
            className="card card-interactive group relative overflow-hidden"
            style={{ padding: "var(--space-5)" }}
        >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-(--color-accent) opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start gap-4">
                <CastAvatar member={member} size={52} />

                <div className="flex-1 min-w-0">
                    <p
                        className="font-semibold truncate"
                        style={{
                            color: "var(--color-text-primary)",
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--text-base)",
                        }}
                    >
                        {member.name}
                    </p>
                    <div className="mt-1">
                        <RoleBadge role={member.role} />
                    </div>
                </div>

                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(member)}
                        className="btn btn-sm btn-ghost-accent btn-icon"
                        title="Edit cast member"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(member)}
                        disabled={isDeleting}
                        className="btn btn-sm btn-outline-danger btn-icon"
                        title="Remove cast member"
                    >
                        {isDeleting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Trash2 size={14} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ movieSelected }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                    background: "var(--color-surface-raised)",
                    border: "1.5px solid var(--color-border-default)",
                }}
            >
                <Users size={28} color="var(--color-text-muted)" />
            </div>
            <p
                className="font-semibold mb-1"
                style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-lg)",
                }}
            >
                {movieSelected ? "No cast members yet" : "Select a movie"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {movieSelected
                    ? "Add the first cast member to get started."
                    : "Choose a movie from the list to manage its cast."}
            </p>
        </div>
    );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────

function CastModal({ mode, initialData, roleOptions, loading, onClose, onSave }) {
    const [form, setForm] = useState({
        name: initialData?.name ?? "",
        role: initialData?.role ?? roleOptions[0] ?? "",
    });

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const isValid = form.name.trim().length >= 2 && form.role;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: "var(--color-overlay)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl"
                style={{
                    background: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border-default)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                    <div>
                        <p className="eyebrow mb-0.5">
                            {mode === "add" ? "Add Member" : "Edit Member"}
                        </p>
                        <h2
                            className="font-bold"
                            style={{
                                color: "var(--color-text-primary)",
                                fontFamily: "var(--font-display)",
                                fontSize: "var(--text-xl)",
                            }}
                        >
                            {mode === "add" ? "New Cast Member" : initialData?.name}
                        </h2>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    <div className="space-y-1.5">
                        <label className="label">Full Name</label>
                        <input
                            className="field field-filled"
                            placeholder="e.g. Astra Venn"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="label">Role</label>
                        {roleOptions.length === 0 ? (
                            <div
                                className="field field-filled flex items-center gap-2"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                <Loader2 size={13} className="animate-spin" />
                                <span className="text-sm">Loading roles…</span>
                            </div>
                        ) : (
                            <select
                                className="field field-filled"
                                value={form.role}
                                onChange={(e) => set("role", e.target.value)}
                            >
                                {roleOptions.map((r) => (
                                    <option key={r} value={r}>
                                        {formatRole(r)}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-3 px-6 py-4"
                    style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                >
                    <button onClick={onClose} className="btn btn-ghost">
                        Cancel
                    </button>
                    <button
                        disabled={!isValid || loading}
                        onClick={() => onSave(form)}
                        className="btn btn-primary"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Saving…
                            </>
                        ) : mode === "add" ? (
                            "Add to Cast"
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ member, loading, onConfirm, onCancel }) {
    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: "var(--color-overlay)" }}
            onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
            <div
                className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-5"
                style={{
                    background: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border-default)",
                }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: "var(--color-bg-danger)",
                            border: "1px solid var(--color-danger)",
                        }}
                    >
                        <Trash2 size={18} color="var(--color-danger)" />
                    </div>
                    <div>
                        <p
                            className="font-semibold"
                            style={{
                                color: "var(--color-text-primary)",
                                fontFamily: "var(--font-display)",
                            }}
                        >
                            Remove cast member?
                        </p>
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            <span style={{ color: "var(--color-danger)" }}>{member.name}</span>{" "}
                            will be permanently removed.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="btn btn-ghost">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="btn btn-danger"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Removing…
                            </>
                        ) : (
                            "Remove"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

const Casts = ({ movies = [], roleOptions = [] }) => {
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [loadingCast, setLoadingCast] = useState(false);
    const [search, setSearch] = useState("");

    const [modal, setModal] = useState(null);   // { mode: "add" | "edit", member? }
    const [confirm, setConfirm] = useState(null); // member pending deletion

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const router = useRouter();
    // ── Fetch cast whenever selected movie changes ──
    useEffect(() => {
        if (!selectedMovie) {
            setCast([]);
            return;
        }

        let cancelled = false;
        setLoadingCast(true);

        getCast(selectedMovie.id)
            .then((data) => {
                if (!cancelled) {
                    setCast(Array.isArray(data) ? data : (data?.cast ?? []));
                }
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load cast.");
            })
            .finally(() => {
                if (!cancelled) setLoadingCast(false);
            });

        return () => { cancelled = true; };
    }, [selectedMovie]);

    const filteredCast = cast.filter(
        (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.role.toLowerCase().includes(search.toLowerCase())
    );

    const refreshCast = useCallback(async () => {
        if (!selectedMovie) return;
        const data = await getCast(selectedMovie.id);
        setCast(Array.isArray(data) ? data : (data?.cast ?? []));
    }, [selectedMovie]);

    // ── Add / Edit ──
    const handleSave = async (form) => {
        setSaving(true);
        try {
            if (modal.mode === "add") {
                await addCast({
                    movieId: selectedMovie.id,
                    cast: [{ name: form.name.trim(), role: form.role }],
                });
                await refreshCast();
                toast.success(`${form.name} added to cast.`);
            } else {
                const updated = await updateCast({
                    movieId: selectedMovie.id,
                    castId: modal.member.id,
                    name: form.name.trim(),
                    role: form.role,
                });
                setCast((prev) =>
                    prev.map((m) => (m.id === modal.member.id ? { ...m, ...updated } : m))
                );
                toast.success(`${form.name} updated.`);
            }
        } catch (err) {
            toast.error(err?.message ?? "Something went wrong.");
        } finally {
            setSaving(false);
            setModal(null);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        const member = confirm;
        setDeletingId(member.id);
        try {
            await removeCastMember({ movieId: selectedMovie.id, castId: member.id });
            setCast((prev) => prev.filter((m) => m.id !== member.id));
            toast.success(`${member.name} removed.`);
        } catch (err) {
            toast.error(err?.message ?? "Failed to remove cast member.");
        } finally {
            setDeletingId(null);
            setConfirm(null);
        }
    };

    const handleSelectMovie = (movie) => {
        setSelectedMovie(movie);
        setSearch("");
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen"
            style={{ background: "var(--color-bg-page)", fontFamily: "var(--font-body)" }}
        >
            <DashboardBox
                text="Cast & Crew"
                subHeading="Select a movie then add, edit, or remove cast members."
            />

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

                    {/* ── Left: Movie List ── */}
                    <aside>
                        <div
                            className="rounded-2xl overflow-hidden sticky top-6"
                            style={{
                                border: "1px solid var(--color-border-subtle)",
                                background: "var(--color-surface)",
                            }}
                        >
                            <div
                                className="px-5 py-4"
                                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                            >
                                <p
                                    className="text-xs font-semibold uppercase tracking-widest"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    Movies
                                </p>
                            </div>

                            {movies.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                                        No movies found.
                                    </p>
                                </div>
                            ) : (
                                <ul
                                    className="divide-y"
                                    style={{ borderColor: "var(--color-border-subtle)" }}
                                >
                                    {movies.map((movie) => {
                                        const active = selectedMovie?.id === movie.id;
                                        return (
                                            <li key={movie.id}>
                                                <button
                                                    onClick={() => handleSelectMovie(movie)}
                                                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                                                    style={{
                                                        background: active
                                                            ? "var(--color-accent-dim)"
                                                            : "transparent",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!active)
                                                            e.currentTarget.style.background =
                                                                "var(--color-surface-hover)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!active)
                                                            e.currentTarget.style.background =
                                                                "transparent";
                                                    }}
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                                        style={{
                                                            background: active
                                                                ? "rgba(254,229,5,0.15)"
                                                                : "var(--color-surface-raised)",
                                                            color: active
                                                                ? "var(--color-accent)"
                                                                : "var(--color-text-muted)",
                                                            fontFamily: "var(--font-display)",
                                                        }}
                                                    >
                                                        {movie.title.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span
                                                        className="flex-1 text-sm font-medium truncate"
                                                        style={{
                                                            fontFamily: "var(--font-display)",
                                                            color: active
                                                                ? "var(--color-accent)"
                                                                : "var(--color-text-primary)",
                                                        }}
                                                    >
                                                        {movie.title}
                                                    </span>
                                                    {active && (
                                                        <ChevronRight
                                                            size={12}
                                                            color="var(--color-accent)"
                                                        />
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </aside>

                    {/* ── Right: Cast Panel ── */}
                    <section>
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                border: "1px solid var(--color-border-subtle)",
                                background: "var(--color-surface)",
                                minHeight: 480,
                            }}
                        >
                            {/* Panel header */}
                            <div
                                className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
                                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <p
                                        className="font-semibold"
                                        style={{
                                            color: "var(--color-text-primary)",
                                            fontFamily: "var(--font-display)",
                                            fontSize: "var(--text-base)",
                                        }}
                                    >
                                        {selectedMovie ? selectedMovie.title : "No movie selected"}
                                    </p>
                                    {cast.length > 0 && (
                                        <span className="badge badge-muted">
                                            {cast.length} member{cast.length !== 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>

                                {selectedMovie && (
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search
                                                size={13}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                                color="var(--color-text-muted)"
                                            />
                                            <input
                                                className="field field-filled field-sm pl-8"
                                                placeholder="Search cast…"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                style={{ width: 180 }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setModal({ mode: "add" })}
                                            className="btn btn-primary btn-sm"
                                        >
                                            <Plus size={14} />
                                            Add Member
                                        </button>
                                        <button
                                            onClick={() => router.refresh()}
                                            className="btn btn-primary btn-sm"
                                        >
                                            <RefreshCcw size={14} />
                                            Refresh
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Panel body */}
                            <div className="p-6">
                                {loadingCast ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2
                                            size={32}
                                            className="animate-spin"
                                            color="var(--color-accent)"
                                        />
                                    </div>
                                ) : !selectedMovie || cast.length === 0 ? (
                                    <EmptyState movieSelected={!!selectedMovie} />
                                ) : filteredCast.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                                            No cast members match "
                                            <span style={{ color: "var(--color-text-secondary)" }}>
                                                {search}
                                            </span>
                                            ".
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredCast.map((member) => (
                                            <CastCard
                                                key={member.id}
                                                member={member}
                                                onEdit={(m) => setModal({ mode: "edit", member: m })}
                                                onDelete={(m) => setConfirm(m)}
                                                isDeleting={deletingId === member.id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ── Modals ── */}
            {modal && (
                <CastModal
                    mode={modal.mode}
                    initialData={modal.member}
                    roleOptions={roleOptions}
                    loading={saving}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    member={confirm}
                    loading={!!deletingId}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default Casts;
