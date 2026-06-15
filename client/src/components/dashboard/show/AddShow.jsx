"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
    Film, Monitor, Clock, Trash2, Plus, ArrowLeft,
    Loader2, AlertCircle, Ticket, Sparkles, CheckCircle2,
} from "lucide-react";
import { createShow } from "@/actions/show.action";
import { getMovies } from "@/actions/movies.action";
import { getScreens } from "@/actions/screen.action";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_PRICE_TYPES = ["FIXED", "PERCENTAGE"];

const toLocalDatetimeValue = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const emptyRule = () => ({ seatType: "", amount: "", type: "FIXED" });

// ─── Shared primitives ────────────────────────────────────────────────────────

const fieldBase =
    "w-full px-3 py-2.5 rounded-lg bg-(--color-surface-hover) border border-(--color-border-default) " +
    "text-(--color-text-primary) text-sm placeholder:text-(--color-text-muted) " +
    "focus:outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/10 " +
    "hover:border-(--color-border-strong) transition-colors appearance-none";

const Section = ({ icon: Icon, title, children }) => (
    <div className="card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-(--color-border-subtle)">
            <div className="w-8 h-8 rounded-lg bg-(--color-purple-dim) flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-(--color-accent)" />
            </div>
            <h3 className="font-display text-base font-semibold text-(--color-text-primary) tracking-tight">
                {title}
            </h3>
        </div>
        {children}
    </div>
);

const Field = ({ label, required, error, hint, children }) => (
    <div className="space-y-1.5">
        <label className="label">
            {label}
            {required && <span className="text-(--color-danger) ml-0.5">*</span>}
        </label>
        {children}
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && (
            <p className="field-error-msg flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />{error}
            </p>
        )}
    </div>
);

const SummaryRow = ({ label, value, highlight }) => (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-(--color-border-subtle) last:border-0">
        <span className="text-xs text-(--color-text-muted) shrink-0">{label}</span>
        <span className={`text-xs font-medium text-right truncate max-w-[160px] ${highlight ? "text-(--color-success)" : "text-(--color-text-secondary)"}`}>
            {value}
        </span>
    </div>
);

// ─── SearchableSelect (unchanged logic) ──────────────────────────────────────

const SearchableSelect = ({ value, onChange, options, placeholder, loading, renderOption, renderSelected }) => {
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

    return (
        <div className="relative" data-ss>
            <button
                type="button"
                disabled={loading}
                onClick={() => setOpen((p) => !p)}
                className={`${fieldBase} text-left flex items-center justify-between gap-2 ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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

const AddShow = ({ seatTypes = [], priceTypes = DEFAULT_PRICE_TYPES }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [movies, setMovies] = useState([]);
    const [screens, setScreens] = useState([]);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingScreens, setLoadingScreens] = useState(true);

    const [form, setForm] = useState({
        movieId: "", screenId: "", startTime: "", cleaningMinutes: "15",
    });
    const [pricingRules, setPricingRules] = useState([emptyRule()]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        (async () => {
            try {
                const data = await getMovies();
                const list = Array.isArray(data) ? data : (data.movies ?? []);
                setMovies(list.filter((m) => ["NOW_SHOWING", "COMING_SOON"].includes(m.status)).map((m) => ({
                    value: m.id, label: m.title,
                    searchText: `${m.title} ${m.language ?? ""}`,
                    status: m.status, duration: m.durationMinutes,
                    posterUrl: m.posterUrl, language: m.language,
                })));
            } catch { toast.error("Failed to load movies"); }
            finally { setLoadingMovies(false); }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const data = await getScreens();
                const list = Array.isArray(data) ? data : (data.screens ?? []);
                setScreens(list.filter((s) => s.isActive).map((s) => ({
                    value: s.id, label: s.name,
                    searchText: `${s.name} ${s.cinema?.name ?? ""} ${s.cinema?.city ?? ""}`,
                    cinema: s.cinema, capacity: s.capacity,
                })));
            } catch { toast.error("Failed to load screens"); }
            finally { setLoadingScreens(false); }
        })();
    }, []);

    const selectedMovie = movies.find((m) => m.value === form.movieId);
    const selectedScreen = screens.find((s) => s.value === form.screenId);

    const endTimePreview = (() => {
        if (!form.startTime || !selectedMovie?.duration) return null;
        return new Date(new Date(form.startTime).getTime() + selectedMovie.duration * 60000)
            .toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    })();

    const occupiedUntilPreview = (() => {
        if (!form.startTime || !selectedMovie?.duration) return null;
        const cleaning = Number(form.cleaningMinutes) || 15;
        return new Date(new Date(form.startTime).getTime() + (selectedMovie.duration + cleaning) * 60000)
            .toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    })();

    const validate = () => {
        const e = {};
        if (!form.movieId) e.movieId = "Please select a movie";
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

    const addRule = () => setPricingRules((p) => [...p, emptyRule()]);
    const removeRule = (i) => setPricingRules((p) => p.filter((_, idx) => idx !== i));
    const updateRule = (i, field, value) =>
        setPricingRules((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

    const handleSubmit = async () => {
        if (!validate()) { toast.error("Please fix the errors before submitting"); return; }
        setIsSubmitting(true);
        try {
            await createShow({
                movieId: form.movieId,
                screenId: form.screenId,
                startTime: new Date(form.startTime).toISOString(),
                cleaningMinutes: Number(form.cleaningMinutes) || 15,
                pricingRules: pricingRules.map((r) => ({
                    seatType: r.seatType || null,
                    amount: Number(r.amount),
                    type: r.type,
                })),
            });
            toast.success("Show scheduled successfully");
            router.push(`/${user?.role}/dashboard/shows`);
        } catch (error) {
            toast.error(error.message ?? "Failed to schedule show");
        } finally {
            setIsSubmitting(false);
        }
    };

    const minDatetime = toLocalDatetimeValue(new Date(Date.now() + 60_000));

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                    <button type="button" onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to shows
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-(--color-accent-dim) border border-(--color-border-accent) flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-(--color-accent)" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-(--color-text-primary) tracking-tight leading-none">
                                Schedule a show
                            </h1>
                            <p className="text-sm text-(--color-text-muted) mt-0.5">
                                Set up a new screening with seating and pricing rules
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button type="button" onClick={() => router.back()} disabled={isSubmitting}
                        className="btn btn-sm btn-ghost">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                        className="btn btn-sm btn-primary shadow-[0_0_16px_rgba(254,229,5,0.2)]">
                        {isSubmitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling…</>
                            : <><Ticket className="w-4 h-4" /> Schedule show</>}
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — main form */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Movie & Screen */}
                    <Section icon={Film} title="Movie & screen">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Movie" required error={errors.movieId}>
                                <SearchableSelect
                                    value={form.movieId}
                                    onChange={(v) => setForm((p) => ({ ...p, movieId: v }))}
                                    options={movies} placeholder="Select a movie" loading={loadingMovies}
                                    renderOption={(o) => (
                                        <div className="flex items-center gap-2.5">
                                            {o.posterUrl
                                                ? <img src={o.posterUrl} className="w-7 h-9 object-cover rounded shrink-0" />
                                                : <div className="w-7 h-9 bg-(--color-surface-hover) rounded shrink-0 flex items-center justify-center">
                                                    <Film className="w-3 h-3 text-(--color-text-muted)" /></div>}
                                            <div>
                                                <p className="font-medium leading-tight">{o.label}</p>
                                                <p className="text-xs text-(--color-text-muted) mt-0.5">
                                                    {[o.language, o.duration ? `${o.duration} min` : null].filter(Boolean).join(" · ")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    renderSelected={(o) => o.label}
                                />
                            </Field>
                            <Field label="Screen" required error={errors.screenId}>
                                <SearchableSelect
                                    value={form.screenId}
                                    onChange={(v) => setForm((p) => ({ ...p, screenId: v }))}
                                    options={screens} placeholder="Select a screen" loading={loadingScreens}
                                    renderOption={(o) => (
                                        <div>
                                            <p className="font-medium leading-tight">{o.label}</p>
                                            <p className="text-xs text-(--color-text-muted) mt-0.5">
                                                {[o.cinema?.name, o.cinema?.city].filter(Boolean).join(", ")}
                                                {o.capacity ? ` · ${o.capacity} seats` : ""}
                                            </p>
                                        </div>
                                    )}
                                    renderSelected={(o) => `${o.label}${o.cinema?.name ? ` — ${o.cinema.name}` : ""}`}
                                />
                            </Field>
                        </div>
                        {(selectedMovie || selectedScreen) && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {selectedMovie && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-info-dim) text-(--color-info)">
                                        <Clock className="w-3 h-3" />{selectedMovie.duration} min runtime
                                    </span>
                                )}
                                {selectedScreen?.cinema && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-success-dim) text-(--color-success)">
                                        <Monitor className="w-3 h-3" />
                                        {[selectedScreen.cinema.name, selectedScreen.cinema.city].filter(Boolean).join(", ")}
                                    </span>
                                )}
                            </div>
                        )}
                    </Section>

                    {/* Timing */}
                    <Section icon={Clock} title="Timing">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Start time" required error={errors.startTime}>
                                <div className="relative">
                                    <input type="datetime-local" className={fieldBase} min={minDatetime}
                                        value={form.startTime}
                                        onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
                                </div>
                            </Field>
                            <Field label="Cleaning buffer" hint="Time between show end and next show.">
                                <div className="relative">
                                    <input type="number" className={fieldBase} min={0} max={60}
                                        value={form.cleaningMinutes} placeholder="15"
                                        onChange={(e) => setForm((p) => ({ ...p, cleaningMinutes: e.target.value }))}
                                        style={{ paddingRight: "2.75rem" }} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--color-text-muted) pointer-events-none">min</span>
                                </div>
                            </Field>
                        </div>
                        {form.startTime && selectedMovie && (
                            <div className="grid grid-cols-3 rounded-[10px] border border-(--color-border-default) overflow-hidden mt-1">
                                {[
                                    { label: "Starts", val: new Date(form.startTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) },
                                    { label: "Ends", val: endTimePreview },
                                    { label: "Hall free at", val: occupiedUntilPreview },
                                ].map((col, i) => (
                                    <div key={i} className={`px-4 py-3 text-center bg-(--color-surface-raised) ${i < 2 ? "border-r border-(--color-border-default)" : ""}`}>
                                        <p className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted) mb-1">{col.label}</p>
                                        <p className="font-display text-lg font-bold text-(--color-text-primary)">{col.val}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Pricing Rules */}
                    <Section icon={Ticket} title="Pricing rules">
                        <p className="text-xs text-(--color-text-muted) -mt-2 mb-1">
                            Add one rule per seat type, or a single global rule with no seat type for uniform pricing.
                        </p>
                        {errors.pricingRules && (
                            <p className="flex items-center gap-1.5 text-xs text-(--color-danger) mb-2">
                                <AlertCircle className="w-3 h-3 shrink-0" />{errors.pricingRules}
                            </p>
                        )}
                        <div className="space-y-3">
                            {pricingRules.map((rule, i) => (
                                <div key={i} className="relative rounded-[10px] border border-(--color-border-default) bg-(--color-surface-raised) p-3.5">
                                    <span className="absolute -top-px left-3 text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted) bg-(--color-surface-raised) px-1.5 -translate-y-1/2">
                                        Rule {i + 1}
                                    </span>
                                    <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2.5 items-start">
                                        <Field label="Seat type">
                                            <select className={fieldBase} value={rule.seatType}
                                                onChange={(e) => updateRule(i, "seatType", e.target.value)}
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23706A85' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "2rem" }}>
                                                <option value="">All seats</option>
                                                {seatTypes.map((st) => (
                                                    <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase().replace(/_/g, " ")}</option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field label="Amount" error={errors[`rule_${i}_amount`]}>
                                            <input type="number" className={fieldBase} min={0} step="0.01"
                                                placeholder="e.g. 500" value={rule.amount}
                                                onChange={(e) => updateRule(i, "amount", e.target.value)} />
                                        </Field>
                                        <Field label="Type">
                                            <select className={fieldBase} value={rule.type}
                                                onChange={(e) => updateRule(i, "type", e.target.value)}
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23706A85' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "2rem" }}>
                                                {priceTypes.map((t) => (
                                                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                                                ))}
                                            </select>
                                        </Field>
                                        <button type="button" disabled={pricingRules.length === 1}
                                            onClick={() => removeRule(i)}
                                            className="mt-[18px] w-9 h-9 rounded-lg border border-(--color-border-default) bg-transparent
                                                flex items-center justify-center text-(--color-text-muted)
                                                hover:border-(--color-danger) hover:text-(--color-danger) hover:bg-(--color-danger-dim)
                                                disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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

                    {/* Visibility — placeholder for future show status */}
                    <Section icon={CheckCircle2} title="Visibility">
                        {["Published", "Draft", "Cancelled"].map((s, i) => (
                            <label key={s} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 mb-2 last:mb-0
                                ${i === 0 ? "border-(--color-accent) bg-(--color-accent-dim)" : "border-(--color-border-default) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"}`}>
                                <input type="radio" name="visibility" defaultChecked={i === 0} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${i === 0 ? "border-(--color-accent) bg-(--color-accent)" : "border-(--color-border-strong)"}`}>
                                    {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-(--color-accent-text)" />}
                                </div>
                                <span className={`text-sm font-medium ${i === 0 ? "text-(--color-text-primary)" : "text-(--color-text-muted)"}`}>{s}</span>
                            </label>
                        ))}
                    </Section>

                    {/* Live summary */}
                    <div className="card rounded-xl p-4 space-y-2 bg-(--color-surface-raised) border-(--color-border-subtle) sticky top-4">
                        <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest mb-3">Summary</p>
                        <SummaryRow label="Movie" value={selectedMovie?.label || "—"} />
                        <SummaryRow label="Screen" value={selectedScreen ? `${selectedScreen.label}${selectedScreen.cinema?.name ? ` — ${selectedScreen.cinema.name}` : ""}` : "—"} />
                        <SummaryRow label="Start time" value={form.startTime ? new Date(form.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} />
                        <SummaryRow label="Duration" value={selectedMovie?.duration ? `${selectedMovie.duration} min` : "—"} />
                        <SummaryRow label="Cleaning" value={`${form.cleaningMinutes || 15} min`} />
                        <SummaryRow
                            label="Pricing rules"
                            value={pricingRules.filter(r => r.amount).length > 0 ? `${pricingRules.filter(r => r.amount).length} configured` : "—"}
                            highlight={pricingRules.filter(r => r.amount).length > 0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddShow;
