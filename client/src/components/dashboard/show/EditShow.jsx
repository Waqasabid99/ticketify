"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Film, Monitor, Clock, Trash2, Plus, ArrowLeft,
    Loader2, AlertCircle, Ticket, Save, RotateCcw,
    AlertTriangle, CheckCircle2, Lock, Zap, Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateShow } from "@/actions/show.action";
import { getScreens } from "@/actions/screen.action";
import { useAuthStore } from "@/store/authStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PRICE_TYPES = ["FIXED", "PERCENTAGE"];

const SHOW_STATUSES = [
    { value: "SCHEDULED", label: "SCHEDULED", note: "Show is live and bookable" },
    { value: "COMPLETED", label: "COMPLETED", note: "Cannot revert once completed" },
    { value: "CANCELLED", label: "CANCELLED", note: "Stops new bookings" },
];

// These transitions are blocked by the backend
const INVALID_TRANSITIONS = {
    COMPLETED: ["SCHEDULED", "CANCELLED"],
    CANCELLED: ["SCHEDULED", "COMPLETED"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toLocalDatetimeValue = (dateStr) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
};

const buildInitialForm = (show) => ({
    screenId: show?.screenId ?? "",
    startTime: toLocalDatetimeValue(show?.startTime),
    cleaningMinutes: show?.cleaningMinutes?.toString() ?? "15",
    status: show?.status ?? "SCHEDULED",
});

const buildInitialRules = (show) =>
    show?.pricingRules?.length
        ? show.pricingRules.map((r) => ({
            id: r.id,
            seatType: r.seatType ?? "",
            amount: r.amount?.toString() ?? "",
            type: r.type ?? "FIXED",
        }))
        : [{ seatType: "", amount: "", type: "FIXED" }];

const emptyRule = () => ({ seatType: "", amount: "", type: "FIXED" });

const fieldBase =
    "w-full px-3 py-2.5 rounded-lg bg-(--color-surface-hover) border border-(--color-border-default) " +
    "text-(--color-text-primary) text-sm placeholder:text-(--color-text-muted) " +
    "focus:outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/10 " +
    "hover:border-(--color-border-strong) transition-colors appearance-none";

const fieldModified = fieldBase +
    " border-(--color-warning)/40 bg-(--color-warning)/[0.03]";

// ─── Sub-components ───────────────────────────────────────────────────────────

const DirtyBadge = ({ count }) =>
    count > 0 ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
            bg-(--color-warning-dim) text-(--color-warning) border border-(--color-warning)/30">
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-warning)" />
            {count} change{count > 1 ? "s" : ""}
        </span>
    ) : null;

const Section = ({ icon: Icon, title, badge, children }) => (
    <div className="card rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-(--color-border-subtle)">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-(--color-purple-dim) flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-(--color-accent)" />
                </div>
                <h3 className="font-display text-base font-semibold text-(--color-text-primary) tracking-tight">
                    {title}
                </h3>
            </div>
            {badge}
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

const Field = ({ label, required, error, hint, dirty, children }) => (
    <div className="space-y-1.5">
        <div className="flex items-center gap-2">
            <label className="label mb-0">
                {label}
                {required && <span className="text-(--color-danger) ml-0.5">*</span>}
            </label>
            {dirty && (
                <span className="inline-flex items-center gap-1 text-xs text-(--color-warning) font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--color-warning) inline-block" />
                    Modified
                </span>
            )}
        </div>
        {children}
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && (
            <p className="field-error-msg flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />{error}
            </p>
        )}
    </div>
);

const SummaryRow = ({ label, current, next }) => {
    const changed = current !== next;
    return (
        <div className="py-1.5 border-b border-(--color-border-subtle) last:border-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-disabled) mb-1">
                {label}
            </p>
            {changed ? (
                <>
                    <p className="text-xs text-(--color-text-muted) line-through truncate">{current || "—"}</p>
                    <p className="text-sm font-medium text-(--color-success) truncate">{next || "—"}</p>
                </>
            ) : (
                <p className="text-sm font-medium text-(--color-text-secondary) truncate">{current || "—"}</p>
            )}
        </div>
    );
};

// ─── SearchableSelect (same as AddShow) ──────────────────────────────────────

const SearchableSelect = ({ value, onChange, options, placeholder, loading, dirty, renderOption, renderSelected }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = options.filter((o) =>
        (o.searchText ?? o.label ?? "").toLowerCase().includes(query.toLowerCase())
    );
    const selected = options.find((o) => o.value === value);

    useEffect(() => { if (!open) setQuery(""); }, [open]);
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (!e.target.closest("[data-ss]")) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const cls = dirty ? fieldModified : fieldBase;

    return (
        <div className="relative" data-ss>
            <button
                type="button"
                disabled={loading}
                onClick={() => setOpen((p) => !p)}
                className={`${cls} text-left flex items-center justify-between gap-2 ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <span className={selected ? "text-(--color-text-primary)" : "text-(--color-text-muted)"}>
                    {loading ? "Loading…" : selected ? (renderSelected ? renderSelected(selected) : selected.label) : placeholder}
                </span>
                {loading
                    ? <Loader2 className="w-3.5 h-3.5 text-(--color-text-muted) animate-spin shrink-0" />
                    : <svg className="w-3.5 h-3.5 text-(--color-text-muted) shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" />
                    </svg>
                }
            </button>
            {open && (
                <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-(--color-border-default) bg-(--color-surface) shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-(--color-border-subtle)">
                        <input autoFocus className={`${fieldBase} py-1.5`} placeholder="Search…"
                            value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <ul className="max-h-52 overflow-y-auto">
                        {filtered.length === 0
                            ? <li className="px-3 py-4 text-sm text-(--color-text-muted) text-center">No results found</li>
                            : filtered.map((o) => (
                                <li key={o.value}
                                    onMouseDown={() => { onChange(o.value); setOpen(false); }}
                                    className={`px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-(--color-surface-hover) ${o.value === value ? "text-(--color-accent) font-medium" : "text-(--color-text-primary)"}`}>
                                    {renderOption ? renderOption(o) : o.label}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EditShow = ({ show, seatTypes = [], priceTypes = DEFAULT_PRICE_TYPES }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Screens for select
    const [screens, setScreens] = useState([]);
    const [loadingScreens, setLoadingScreens] = useState(true);

    // Form state
    const [form, setForm] = useState(() => buildInitialForm(show));
    const [original] = useState(() => buildInitialForm(show));

    // Pricing rules
    const [pricingRules, setPricingRules] = useState(() => buildInitialRules(show));
    const [originalRules] = useState(() => buildInitialRules(show));

    // Errors
    const [errors, setErrors] = useState({});

    // Quick-status updating (optimistic, instant)
    const [quickStatusUpdating, setQuickStatusUpdating] = useState(false);

    // ── Load screens ──────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const data = await getScreens();
                const list = Array.isArray(data) ? data : (data.screens ?? []);
                setScreens(
                    list.filter((s) => s.isActive).map((s) => ({
                        value: s.id,
                        label: s.name,
                        searchText: `${s.name} ${s.cinema?.name ?? ""} ${s.cinema?.city ?? ""}`,
                        cinema: s.cinema,
                        capacity: s.capacity,
                    }))
                );
            } catch { toast.error("Failed to load screens"); }
            finally { setLoadingScreens(false); }
        })();
    }, []);

    // ── Derived ───────────────────────────────────────────────────

    const selectedScreen = screens.find((s) => s.value === form.screenId);
    const movieDuration = show?.movie?.durationMinutes ?? show?.durationMinutes ?? null;

    const endTimePreview = (() => {
        if (!form.startTime || !movieDuration) return null;
        return new Date(new Date(form.startTime).getTime() + movieDuration * 60000)
            .toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    })();

    const occupiedUntilPreview = (() => {
        if (!form.startTime || !movieDuration) return null;
        const cleaning = Number(form.cleaningMinutes) || 15;
        return new Date(new Date(form.startTime).getTime() + (movieDuration + cleaning) * 60000)
            .toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    })();

    // ── Dirty tracking ─────────────────────────────────────────────

    const dirtyFields = Object.keys(form).filter((k) => String(form[k]) !== String(original[k]));

    const dirtyRuleIndices = pricingRules
        .map((r, i) => {
            const orig = originalRules[i];
            if (!orig) return true; // new rule
            return r.seatType !== orig.seatType || r.amount !== orig.amount || r.type !== orig.type;
        })
        .map((dirty, i) => (dirty ? i : -1))
        .filter((i) => i !== -1);

    const newRulesCount = pricingRules.length - originalRules.length;
    const rulesDirty = dirtyRuleIndices.length > 0;

    const timingDirty = dirtyFields.some((f) => ["startTime", "cleaningMinutes"].includes(f));
    const screenDirty = dirtyFields.includes("screenId");
    const statusDirty = dirtyFields.includes("status");

    const totalChanges =
        (screenDirty ? 1 : 0) +
        (timingDirty ? 1 : 0) +
        (statusDirty ? 1 : 0) +
        (rulesDirty ? 1 : 0);

    // ── Status transition guard ────────────────────────────────────

    const isStatusBlocked = (targetStatus) => {
        const blocked = INVALID_TRANSITIONS[original.status] ?? [];
        return blocked.includes(targetStatus);
    };

    // ── Quick status switch ────────────────────────────────────────

    const handleQuickStatus = async (newStatus) => {
        if (newStatus === form.status || isStatusBlocked(newStatus)) return;
        setQuickStatusUpdating(true);
        try {
            await updateShow(show.id, { status: newStatus });
            setForm((f) => ({ ...f, status: newStatus }));
            toast.success(`Status changed to ${newStatus}`);
        } catch (err) {
            toast.error(err.message ?? "Failed to update status");
        } finally {
            setQuickStatusUpdating(false);
        }
    };

    // ── Reset ──────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
        setForm(buildInitialForm(show));
        setPricingRules(buildInitialRules(show));
        setErrors({});
        toast.info("Changes discarded.");
    }, [show]);

    // ── Pricing rule handlers ─────────────────────────────────────

    const addRule = () => setPricingRules((p) => [...p, emptyRule()]);
    const removeRule = (i) => setPricingRules((p) => p.filter((_, idx) => idx !== i));
    const updateRule = (i, field, value) =>
        setPricingRules((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

    // ── Validation ────────────────────────────────────────────────

    const validate = () => {
        const e = {};
        if (!form.screenId) e.screenId = "Please select a screen";
        if (!form.startTime) e.startTime = "Start time is required";
        else if (new Date(form.startTime) <= new Date()) e.startTime = "Start time must be in the future";
        if (pricingRules.length === 0) e.pricingRules = "At least one pricing rule is required";
        else pricingRules.forEach((rule, i) => {
            if (!rule.amount || isNaN(Number(rule.amount)) || Number(rule.amount) <= 0)
                e[`rule_${i}_amount`] = "Enter a valid amount";
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!validate()) { toast.error("Please fix the errors before saving"); return; }
        if (totalChanges === 0) { toast.info("No changes to save"); return; }

        setIsSubmitting(true);
        try {
            const payload = {};
            if (screenDirty) payload.screenId = form.screenId;
            if (timingDirty) {
                payload.startTime = new Date(form.startTime).toISOString();
                payload.cleaningMinutes = Number(form.cleaningMinutes) || 15;
            }
            if (statusDirty) payload.status = form.status;
            if (rulesDirty) {
                payload.pricingRules = pricingRules.map((r) => ({
                    ...(r.id ? { id: r.id } : {}),
                    seatType: r.seatType || null,
                    amount: Number(r.amount),
                    type: r.type,
                }));
            }

            await updateShow(show.id, payload);
            toast.success("Show updated successfully");
            router.push(`/${user?.role}/dashboard/shows`);
        } catch (err) {
            toast.error(err.message ?? "Failed to update show");
        } finally {
            setIsSubmitting(false);
        }
    };

    const minDatetime = (() => {
        const d = new Date(Date.now() + 60_000);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    })();

    // ── Render ────────────────────────────────────────────────────

    return (
        <div className="w-full max-w-5xl mx-auto space-y-4 pb-16">

            {/* Back link */}
            <button type="button" onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to shows
            </button>

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                    {show?.movie?.posterUrl ? (
                        <img src={show.movie.posterUrl} alt={show.movie.title}
                            className="w-11 h-16 object-cover rounded-lg border border-(--color-border-subtle) shrink-0" />
                    ) : (
                        <div className="w-11 h-16 rounded-lg bg-(--color-purple-dim) border border-(--color-border-subtle) flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-(--color-text-muted)" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="font-display text-2xl font-bold text-(--color-text-primary) tracking-tight leading-none truncate">
                                {show?.movie?.title ?? "Show"}{show?.screen?.name ? ` — ${show.screen.name}` : ""}
                            </h1>
                            {totalChanges > 0 && <DirtyBadge count={totalChanges} />}
                        </div>
                        <p className="text-sm text-(--color-text-muted) mt-1 flex items-center gap-1.5">
                            <Ticket className="w-3.5 h-3.5" />
                            Editing show details
                            {show?.id && (
                                <code className="ml-1 text-xs text-(--color-info) bg-(--color-purple-dim) px-1.5 py-0.5 rounded font-mono">
                                    {show.id.slice(0, 8)}
                                </code>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                    {totalChanges > 0 && (
                        <button type="button" onClick={handleReset} disabled={isSubmitting}
                            className="btn btn-sm btn-ghost text-(--color-text-muted) hover:text-(--color-danger) hover:bg-(--color-danger-dim)">
                            <RotateCcw className="w-4 h-4" /> Discard
                        </button>
                    )}
                    <button type="button" onClick={() => router.back()} disabled={isSubmitting}
                        className="btn btn-sm btn-ghost">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit}
                        disabled={isSubmitting || totalChanges === 0}
                        className="btn btn-sm btn-primary shadow-[0_0_16px_rgba(254,229,5,0.2)] disabled:opacity-40 disabled:cursor-not-allowed">
                        {isSubmitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            : <><Save className="w-4 h-4" /> Save changes{totalChanges > 0 ? ` (${totalChanges})` : ""}</>
                        }
                    </button>
                </div>
            </div>

            {/* Quick status bar */}
            <div className="flex items-center gap-2.5 flex-wrap px-4 py-2.5 rounded-xl bg-(--color-surface) border border-(--color-border-subtle)">
                <span className="text-xs text-(--color-text-muted) font-medium flex items-center gap-1.5 flex-shrink-0">
                    <Zap className="w-3 h-3" /> Quick switch:
                </span>
                {SHOW_STATUSES.map((s) => {
                    const active = s.value === form.status;
                    const blocked = isStatusBlocked(s.value);
                    return (
                        <button key={s.value} type="button"
                            disabled={quickStatusUpdating || active || blocked}
                            onClick={() => handleQuickStatus(s.value)}
                            title={blocked ? `Cannot transition from ${original.status} to ${s.value}` : undefined}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150
                                disabled:cursor-not-allowed
                                ${active
                                    ? "bg-(--color-accent) text-(--color-accent-text) border-(--color-accent)"
                                    : blocked
                                        ? "opacity-30 bg-(--color-surface-raised) border-(--color-border-default) text-(--color-text-disabled)"
                                        : "bg-(--color-surface-raised) border-(--color-border-default) text-(--color-text-secondary) hover:border-(--color-border-strong) hover:text-(--color-text-primary)"
                                }`}>
                            {quickStatusUpdating && !active
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-(--color-accent-text)" : s.value === "SCHEDULED" ? "bg-(--color-info)" : s.value === "COMPLETED" ? "bg-(--color-success)" : "bg-(--color-danger)"}`} />
                            }
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {/* Unsaved banner */}
            {totalChanges > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-(--color-warning-dim) border border-(--color-warning)/25 text-sm text-(--color-warning)">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                        You have <strong>{totalChanges} unsaved change{totalChanges > 1 ? "s" : ""}</strong> — remember to save before leaving.
                    </span>
                </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Movie — read only */}
                    <Section icon={Film} title="Movie">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-(--color-surface-raised) border border-(--color-border-subtle)">
                            {show?.movie?.posterUrl ? (
                                <img src={show.movie.posterUrl} alt={show.movie.title}
                                    className="w-8 h-11 object-cover rounded-md flex-shrink-0" />
                            ) : (
                                <div className="w-8 h-11 rounded-md bg-(--color-purple-dim) flex items-center justify-center flex-shrink-0">
                                    <Film className="w-3.5 h-3.5 text-(--color-text-muted)" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-(--color-text-primary) truncate">
                                    {show?.movie?.title ?? "—"}
                                </p>
                                <p className="text-xs text-(--color-text-muted) mt-0.5">
                                    {[show?.movie?.language, movieDuration ? `${movieDuration} min` : null, show?.movie?.status]
                                        .filter(Boolean).join(" · ")}
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-text-muted) bg-(--color-border-subtle) px-2 py-1 rounded flex-shrink-0">
                                <Lock className="w-3 h-3" /> Locked
                            </span>
                        </div>
                        <p className="text-xs text-(--color-text-disabled) flex items-center gap-1.5 -mt-1">
                            <Info className="w-3 h-3 flex-shrink-0" />
                            Movie cannot be changed after a show is created. Create a new show to change the movie.
                        </p>
                    </Section>

                    {/* Screen & Timing */}
                    <Section
                        icon={Clock}
                        title="Screen & timing"
                        badge={<DirtyBadge count={(screenDirty ? 1 : 0) + (timingDirty ? 1 : 0)} />}
                    >
                        {/* Screen */}
                        <Field label="Screen" required error={errors.screenId} dirty={screenDirty}>
                            <SearchableSelect
                                value={form.screenId}
                                onChange={(v) => setForm((p) => ({ ...p, screenId: v }))}
                                options={screens}
                                placeholder="Select a screen"
                                loading={loadingScreens}
                                dirty={screenDirty}
                                renderOption={(o) => (
                                    <div>
                                        <p className="font-medium leading-tight">{o.label}</p>
                                        <p className="text-xs text-(--color-text-muted) mt-0.5">
                                            {[o.cinema?.name, o.cinema?.city].filter(Boolean).join(", ")}
                                            {o.capacity ? ` · ${o.capacity} seats` : ""}
                                        </p>
                                    </div>
                                )}
                                renderSelected={(o) =>
                                    `${o.label}${o.cinema?.name ? ` — ${o.cinema.name}` : ""}`
                                }
                            />
                        </Field>

                        {/* Start time + cleaning */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Start time" required error={errors.startTime} dirty={dirtyFields.includes("startTime")}>
                                <input
                                    type="datetime-local"
                                    className={dirtyFields.includes("startTime") ? fieldModified : fieldBase}
                                    min={minDatetime}
                                    value={form.startTime}
                                    onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                                />
                            </Field>
                            <Field label="Cleaning buffer" hint="Time between show end and next show."
                                dirty={dirtyFields.includes("cleaningMinutes")}>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={`${dirtyFields.includes("cleaningMinutes") ? fieldModified : fieldBase}`}
                                        min={0} max={60}
                                        value={form.cleaningMinutes}
                                        placeholder="15"
                                        onChange={(e) => setForm((p) => ({ ...p, cleaningMinutes: e.target.value }))}
                                        style={{ paddingRight: "2.75rem" }}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--color-text-muted) pointer-events-none">min</span>
                                </div>
                            </Field>
                        </div>

                        {/* Time preview */}
                        {form.startTime && movieDuration && (
                            <div className="grid grid-cols-3 rounded-[10px] border border-(--color-border-default) overflow-hidden">
                                {[
                                    { label: "Starts", val: new Date(form.startTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }), changed: dirtyFields.includes("startTime") },
                                    { label: "Ends", val: endTimePreview, changed: dirtyFields.includes("startTime") },
                                    { label: "Hall free at", val: occupiedUntilPreview, changed: timingDirty },
                                ].map((col, i) => (
                                    <div key={i} className={`px-4 py-3 text-center bg-(--color-surface-raised) ${i < 2 ? "border-r border-(--color-border-default)" : ""}`}>
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted) mb-1">{col.label}</p>
                                        <p className={`font-display text-lg font-bold ${col.changed ? "text-(--color-warning)" : "text-(--color-text-primary)"}`}>
                                            {col.val}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Pricing Rules */}
                    <Section
                        icon={Ticket}
                        title="Pricing rules"
                        badge={<DirtyBadge count={rulesDirty ? 1 : 0} />}
                    >
                        <p className="text-xs text-(--color-text-muted) -mt-1 mb-1">
                            Editing a rule updates it in-place by seat type. Adding a new seat type creates a new rule.
                        </p>

                        {errors.pricingRules && (
                            <p className="flex items-center gap-1.5 text-xs text-(--color-danger) mb-2">
                                <AlertCircle className="w-3 h-3 shrink-0" />{errors.pricingRules}
                            </p>
                        )}

                        <div className="space-y-3">
                            {pricingRules.map((rule, i) => {
                                const origRule = originalRules[i];
                                const isNewRule = !origRule;
                                const ruleChanged = isNewRule || (
                                    rule.seatType !== origRule.seatType ||
                                    rule.amount !== origRule.amount ||
                                    rule.type !== origRule.type
                                );

                                return (
                                    <div key={i} className="relative rounded-[10px] border border-(--color-border-default) bg-(--color-surface-raised) p-3.5">
                                        <span className="absolute -top-px left-3 text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) bg-(--color-surface-raised) px-1.5 -translate-y-1/2">
                                            Rule {i + 1}{rule.seatType ? ` · ${rule.seatType}` : " · All seats"}
                                        </span>
                                        {ruleChanged && (
                                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-(--color-warning)" title="Modified" />
                                        )}
                                        {isNewRule && (
                                            <span className="absolute top-1.5 right-6 text-[10px] font-semibold text-(--color-success) bg-(--color-success-dim) px-1.5 py-0.5 rounded">New</span>
                                        )}

                                        <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2.5 items-start">
                                            <Field label="Seat type">
                                                <select
                                                    className={`${fieldBase} ${ruleChanged && !isNewRule ? "border-(--color-warning)/40 bg-(--color-warning)/[0.03]" : ""}`}
                                                    value={rule.seatType}
                                                    onChange={(e) => updateRule(i, "seatType", e.target.value)}
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23706A85' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "2rem" }}>
                                                    <option value="">All seats</option>
                                                    {seatTypes.map((st) => (
                                                        <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase().replace(/_/g, " ")}</option>
                                                    ))}
                                                </select>
                                            </Field>
                                            <Field label="Amount" error={errors[`rule_${i}_amount`]}>
                                                <input type="number" min={0} step="0.01"
                                                    className={`${fieldBase} ${rule.amount !== origRule?.amount ? "border-(--color-warning)/40 bg-(--color-warning)/[0.03]" : ""}`}
                                                    placeholder="e.g. 500" value={rule.amount}
                                                    onChange={(e) => updateRule(i, "amount", e.target.value)} />
                                            </Field>
                                            <Field label="Type">
                                                <select
                                                    className={`${fieldBase} ${rule.type !== origRule?.type ? "border-(--color-warning)/40 bg-(--color-warning)/[0.03]" : ""}`}
                                                    value={rule.type}
                                                    onChange={(e) => updateRule(i, "type", e.target.value)}
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23706A85' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "2rem" }}>
                                                    {priceTypes.map((t) => (
                                                        <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                                                    ))}
                                                </select>
                                            </Field>
                                            <button type="button"
                                                disabled={pricingRules.length === 1}
                                                onClick={() => removeRule(i)}
                                                className="mt-[18px] w-9 h-9 rounded-lg border border-(--color-border-default) bg-transparent
                                                    flex items-center justify-center text-(--color-text-muted)
                                                    hover:border-(--color-danger) hover:text-(--color-danger) hover:bg-(--color-danger-dim)
                                                    disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button type="button" onClick={addRule}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-accent) hover:text-(--color-accent-hover) bg-transparent border-none cursor-pointer mt-3 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            Add pricing rule
                        </button>
                    </Section>
                </div>

                {/* Right sidebar */}
                <div className="space-y-5">

                    {/* Status */}
                    <Section
                        icon={CheckCircle2}
                        title="Status"
                        badge={<DirtyBadge count={statusDirty ? 1 : 0} />}
                    >
                        {SHOW_STATUSES.map((s) => {
                            const active = form.status === s.value;
                            const blocked = isStatusBlocked(s.value);
                            return (
                                <label key={s.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 mb-2 last:mb-0
                                        ${blocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                                        ${active
                                            ? "border-(--color-accent) bg-(--color-accent-dim)"
                                            : "border-(--color-border-default) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"
                                        }`}>
                                    <input type="radio" name="show-status" value={s.value}
                                        checked={active}
                                        disabled={blocked}
                                        onChange={() => !blocked && setForm((f) => ({ ...f, status: s.value }))}
                                        className="hidden" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? "border-(--color-accent) bg-(--color-accent)" : "border-(--color-border-strong)"}`}>
                                        {active && <div className="w-1.5 h-1.5 rounded-full bg-(--color-accent-text)" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${active ? "text-(--color-text-primary)" : "text-(--color-text-muted)"}`}>
                                            {s.label}
                                        </p>
                                        <p className="text-xs text-(--color-text-disabled) mt-0.5">{s.note}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </Section>

                    {/* Summary card */}
                    <div className="card rounded-xl p-4 bg-(--color-surface-raised) border-(--color-border-subtle) sticky top-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest">
                                Current values
                            </p>
                            {totalChanges > 0 && (
                                <span className="text-xs text-(--color-warning)">Unsaved</span>
                            )}
                        </div>

                        <SummaryRow
                            label="Screen"
                            current={(() => {
                                const orig = screens.find((s) => s.value === original.screenId);
                                return orig ? `${orig.label}${orig.cinema?.name ? ` — ${orig.cinema.name}` : ""}` : show?.screen?.name ?? "—";
                            })()}
                            next={selectedScreen ? `${selectedScreen.label}${selectedScreen.cinema?.name ? ` — ${selectedScreen.cinema.name}` : ""}` : "—"}
                        />
                        <SummaryRow
                            label="Start time"
                            current={original.startTime ? new Date(original.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                            next={form.startTime ? new Date(form.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        />
                        <SummaryRow
                            label="Cleaning"
                            current={`${original.cleaningMinutes || 15} min`}
                            next={`${form.cleaningMinutes || 15} min`}
                        />
                        <SummaryRow
                            label="Status"
                            current={original.status}
                            next={form.status}
                        />
                        <SummaryRow
                            label="Pricing rules"
                            current={`${originalRules.length} rule${originalRules.length !== 1 ? "s" : ""}`}
                            next={`${pricingRules.length} rule${pricingRules.length !== 1 ? "s" : ""}${dirtyRuleIndices.length > 0 ? ` · ${dirtyRuleIndices.length} modified` : ""}`}
                        />

                        {/* Duration info (from movie, always static) */}
                        {movieDuration && (
                            <div className="py-1.5 mt-1 border-t border-(--color-border-subtle)">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-disabled) mb-1">Movie duration</p>
                                <p className="text-sm font-medium text-(--color-text-secondary)">{movieDuration} min</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditShow;
