"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Film,
    Clock,
    Calendar,
    Globe,
    ShieldAlert,
    Link as LinkIcon,
    Tag,
    ImagePlus,
    X,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Upload,
    Pencil,
    AlertTriangle,
    RotateCcw,
    Zap,
    Save,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateMovie } from "@/actions/movies.action";
import { useAuthStore } from "@/store/authStore";

/* ─── Helpers ─────────────────────────────────────────────────── */
const toDateInputValue = (dateStr) => {
    if (!dateStr) return "";
    try { return new Date(dateStr).toISOString().split("T")[0]; }
    catch { return ""; }
};

const buildInitialForm = (movie) => ({
    title: movie?.title ?? "",
    description: movie?.description ?? "",
    durationMinutes: movie?.durationMinutes?.toString() ?? "",
    releaseDate: toDateInputValue(movie?.releaseDate),
    language: movie?.language ?? "",
    ageRestriction: movie?.ageRestriction?.toString() ?? "",
    trailerUrl: movie?.trailerUrl ?? "",
    status: movie?.status ?? "COMING_SOON",
    genreIds: movie?.genres?.map((g) => g.genreId ?? g.genre?.id ?? g.id) ?? [],
});

/* ─── ImageUploadZone ─────────────────────────────────────────── */
const ImageUploadZone = ({
    label, hint, name, preview, isExisting,
    onFileChange, onClear, onRestoreExisting, aspect = "poster",
    existingUrl,
}) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const isPoster = aspect === "poster";

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileChange(file);
    };

    const hasImage = !!preview;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="label mb-0">{label}</label>
                {/* Show restore button only when user cleared an existing image */}
                {!hasImage && existingUrl && (
                    <button
                        type="button"
                        onClick={onRestoreExisting}
                        className="inline-flex items-center gap-1 text-xs text-(--color-info) hover:text-(--color-info-hover) transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Restore original
                    </button>
                )}
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !hasImage && inputRef.current?.click()}
                className={[
                    "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center",
                    isPoster ? "h-64 w-44" : "h-44 w-full",
                    hasImage ? "border-transparent cursor-default" : "cursor-pointer",
                    dragging
                        ? "border-(--color-accent) bg-(--color-accent-dim)"
                        : hasImage
                            ? "border-(--color-border-subtle)"
                            : "border-(--color-border-default) bg-(--color-surface) hover:border-(--color-purple-bright) hover:bg-(--color-surface-hover)",
                ].join(" ")}
            >
                {hasImage ? (
                    <>
                        <img src={preview} alt={label} className="w-full h-full object-cover" />

                        {/* Existing vs new badge */}
                        <div className={[
                            "absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm",
                            isExisting
                                ? "bg-black/40 text-(--color-text-muted)"
                                : "bg-(--color-success-dim) text-(--color-success) border border-(--color-success)",
                        ].join(" ")}>
                            {isExisting ? "Current" : "New"}
                        </div>

                        {/* Hover controls */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                                className="btn btn-sm bg-white/10 text-white border border-white/20 backdrop-blur-sm hover:bg-white/25 transition-colors"
                            >
                                <Upload className="w-3.5 h-3.5" /> Replace
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onClear(); }}
                                className="btn btn-sm bg-white/10 text-white border border-white/20 backdrop-blur-sm hover:bg-(--color-danger-dim) transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center pointer-events-none">
                        <div className="w-10 h-10 rounded-lg bg-(--color-purple-dim) flex items-center justify-center">
                            <ImagePlus className="w-5 h-5 text-(--color-purple-bright)" />
                        </div>
                        <p className="text-sm text-(--color-text-muted)">
                            <span className="text-(--color-info) font-medium">Click to upload</span>{" "}or drag & drop
                        </p>
                        <p className="text-xs text-(--color-text-disabled)">{hint}</p>
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                name={name}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileChange(file);
                    e.target.value = "";
                }}
            />
        </div>
    );
};

/* ─── GenrePicker ─────────────────────────────────────────────── */
const GenrePicker = ({ selected, onChange, genres }) => {
    const toggle = (id) => {
        onChange(selected.includes(id)
            ? selected.filter((g) => g !== id)
            : [...selected, id]);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {genres?.map((genre) => {
                const active = selected.includes(genre.id);
                return (
                    <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggle(genre.id)}
                        className={[
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                            active
                                ? "bg-(--color-accent) text-(--color-accent-text) border-(--color-accent) shadow-[0_0_12px_rgba(254,229,5,0.25)]"
                                : "bg-(--color-surface) text-(--color-text-secondary) border-(--color-border-default) hover:border-(--color-border-strong) hover:text-(--color-text-primary)",
                        ].join(" ")}
                    >
                        {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {genre.name}
                    </button>
                );
            })}
        </div>
    );
};

/* ─── Section ─────────────────────────────────────────────────── */
const Section = ({ icon: Icon, title, badge, children }) => (
    <div className="card rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-1 border-b border-(--color-border-subtle)">
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
        {children}
    </div>
);

/* ─── Field ───────────────────────────────────────────────────── */
const Field = ({ label, hint, error, children, required, dirty }) => (
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
        {error && <p className="field-error-msg">{error}</p>}
    </div>
);

/* ─── DirtyBadge ──────────────────────────────────────────────── */
const DirtyBadge = ({ count }) =>
    count > 0 ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-(--color-warning-dim) text-(--color-warning) border border-(--color-warning)/30">
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-warning)" />
            {count} change{count > 1 ? "s" : ""}
        </span>
    ) : null;

/* ─── QuickStatusBar ──────────────────────────────────────────── */
const QuickStatusBar = ({ currentStatus, movieId, onStatusChange, statuses }) => {
    const [updating, setUpdating] = useState(false);

    const handleQuickStatus = async (newStatus) => {
        if (newStatus === currentStatus) return;
        setUpdating(true);
        try {
            const fd = new FormData();
            fd.append("status", newStatus);
            await updateMovie(movieId, fd);
            onStatusChange(newStatus);
            toast.success(`Status changed to ${statuses.find(s => s === newStatus)}`);
        } catch (err) {
            toast.error(err.message ?? "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-(--color-text-muted) font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Quick switch:
            </span>
            {statuses?.map((s) => {
                const active = s === currentStatus;
                return (
                    <button
                        key={s}
                        type="button"
                        disabled={updating || active}
                        onClick={() => handleQuickStatus(s)}
                        className={[
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
                            active
                                ? "bg-(--color-accent) text-(--color-accent-text) border-(--color-accent)"
                                : "bg-(--color-surface-raised) border-(--color-border-default) text-(--color-text-secondary) hover:border-(--color-border-strong) hover:text-(--color-text-primary)",
                        ].join(" ")}
                    >
                        {updating && !active
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-(--color-accent-text)" : s.dotClass}`} />
                        }
                        {s}
                    </button>
                );
            })}
        </div>
    );
};

const EditMoviePage = ({ movie, genres, statuses }) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ── Form state ─────────────────────────────────────────────── */
    const [form, setForm] = useState(() => buildInitialForm(movie));
    const [original] = useState(() => buildInitialForm(movie));   // frozen snapshot

    /* ── Image state ─────────────────────────────────────────────── */
    // poster
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(movie?.posterUrl ?? null);
    const [posterIsExisting, setPosterIsExisting] = useState(!!movie?.posterUrl);

    // banner
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(movie?.bannerUrl ?? null);
    const [bannerIsExisting, setBannerIsExisting] = useState(!!movie?.bannerUrl);
    const { user } = useAuthStore();

    /* ── Errors ──────────────────────────────────────────────────── */
    const [errors, setErrors] = useState({});

    /* ── Dirty tracking ──────────────────────────────────────────── */
    const dirtyFields = Object.keys(form).filter((k) => {
        if (k === "genreIds") {
            return JSON.stringify([...form.genreIds].sort()) !== JSON.stringify([...original.genreIds].sort());
        }
        return String(form[k]) !== String(original[k]);
    });

    const imagesDirty = posterFile !== null || bannerFile !== null
        || posterPreview !== (movie?.posterUrl ?? null)
        || bannerPreview !== (movie?.bannerUrl ?? null);

    const totalChanges = dirtyFields.length + (imagesDirty ? 1 : 0);

    /* ── Helpers ─────────────────────────────────────────────────── */
    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const setImageFile = (type) => (file) => {
        const url = URL.createObjectURL(file);
        if (type === "poster") { setPosterFile(file); setPosterPreview(url); setPosterIsExisting(false); }
        else { setBannerFile(file); setBannerPreview(url); setBannerIsExisting(false); }
    };

    const clearImage = (type) => () => {
        if (type === "poster") { setPosterFile(null); setPosterPreview(null); setPosterIsExisting(false); }
        else { setBannerFile(null); setBannerPreview(null); setBannerIsExisting(false); }
    };

    const restoreExisting = (type) => () => {
        if (type === "poster") {
            setPosterFile(null);
            setPosterPreview(movie?.posterUrl ?? null);
            setPosterIsExisting(true);
        } else {
            setBannerFile(null);
            setBannerPreview(movie?.bannerUrl ?? null);
            setBannerIsExisting(true);
        }
    };

    const handleReset = useCallback(() => {
        setForm(buildInitialForm(movie));
        setPosterFile(null);
        setPosterPreview(movie?.posterUrl ?? null);
        setPosterIsExisting(!!movie?.posterUrl);
        setBannerFile(null);
        setBannerPreview(movie?.bannerUrl ?? null);
        setBannerIsExisting(!!movie?.bannerUrl);
        setErrors({});
        toast.info("Changes discarded.");
    }, [movie]);

    /* ── Validation ──────────────────────────────────────────────── */
    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Title is required";
        if (!form.durationMinutes || isNaN(Number(form.durationMinutes)) || Number(form.durationMinutes) <= 0)
            e.durationMinutes = "Enter a valid duration in minutes";
        if (!form.language.trim()) e.language = "Language is required";
        if (!form.status) e.status = "Status is required";
        if (form.trailerUrl && !/^https?:\/\/.+/.test(form.trailerUrl))
            e.trailerUrl = "Enter a valid URL (must start with http/https)";
        if (form.ageRestriction && (isNaN(Number(form.ageRestriction)) || Number(form.ageRestriction) < 0))
            e.ageRestriction = "Enter a valid age (0 or above)";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ── Submit ──────────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) { toast.error("Please fix the errors before saving."); return; }
        if (totalChanges === 0) { toast.info("No changes to save."); return; }

        setIsSubmitting(true);
        try {
            const fd = new FormData();

            // Only append fields that actually changed (or all required ones)
            fd.append("title", form.title.trim());
            fd.append("description", form.description.trim());
            fd.append("durationMinutes", form.durationMinutes);
            fd.append("language", form.language.trim());
            fd.append("status", form.status);
            fd.append("trailerUrl", form.trailerUrl.trim());
            fd.append("releaseDate", form.releaseDate ?? "");
            fd.append("ageRestriction", form.ageRestriction ?? "");
            fd.append("genreIds", JSON.stringify(form.genreIds));

            // Only send image files if user selected a new one
            if (posterFile) fd.append("poster", posterFile);
            if (bannerFile) fd.append("banner", bannerFile);

            await updateMovie(movie.id, fd);
            toast.success("Movie updated successfully!");
            router.push(`/${user?.role}/dashboard/movies`);
        } catch (err) {
            toast.error(err.message ?? "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Render ──────────────────────────────────────────────────── */
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">

            {/* ── Page Header ──────────────────────────────────── */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Movies
                </button>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Poster thumbnail in header */}
                        {movie?.posterUrl ? (
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-12 h-16 object-cover rounded-lg border border-(--color-border-subtle) shrink-0 shadow-md"
                            />
                        ) : (
                            <div className="w-12 h-16 rounded-lg bg-(--color-purple-dim) border border-(--color-border-subtle) flex items-center justify-center shrink-0">
                                <Film className="w-5 h-5 text-(--color-text-muted)" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="font-display text-2xl font-bold text-(--color-text-primary) tracking-tight leading-none truncate">
                                    {movie?.title ?? "Edit Movie"}
                                </h1>
                                {totalChanges > 0 && <DirtyBadge count={totalChanges} />}
                            </div>
                            <p className="text-sm text-(--color-text-muted) mt-1 flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5" />
                                Editing movie details
                                {movie?.slug && (
                                    <code className="ml-1 text-xs text-(--color-info) bg-(--color-purple-dim) px-1.5 py-0.5 rounded font-mono">
                                        {movie.slug}
                                    </code>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        {totalChanges > 0 && (
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isSubmitting}
                                className="btn btn-sm btn-ghost text-(--color-text-muted) hover:text-(--color-danger) hover:bg-(--color-danger-dim)"
                            >
                                <RotateCcw className="w-4 h-4" /> Discard
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                            className="btn btn-sm btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="edit-movie-form"
                            disabled={isSubmitting || totalChanges === 0}
                            className="btn btn-sm btn-primary shadow-[0_0_16px_rgba(254,229,5,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSubmitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                : <><Save className="w-4 h-4" /> Save Changes{totalChanges > 0 ? ` (${totalChanges})` : ""}</>
                            }
                        </button>
                    </div>
                </div>

                {/* Quick Status Switcher */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-(--color-surface) border border-(--color-border-subtle)">
                    <QuickStatusBar
                        currentStatus={form.status}
                        movieId={movie?.id}
                        onStatusChange={(s) => setForm((f) => ({ ...f, status: s }))}
                    />
                </div>
            </div>

            {/* ── Unsaved changes banner ────────────────────────── */}
            {totalChanges > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-(--color-warning-dim) border border-(--color-warning)/25 text-sm text-(--color-warning)">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                        You have <strong>{totalChanges} unsaved change{totalChanges > 1 ? "s" : ""}</strong>
                    </span>
                </div>
            )}

            {/* ── Form ─────────────────────────────────────────── */}
            <form id="edit-movie-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT COLUMN ──────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Core Info */}
                    <Section
                        icon={Film}
                        title="Core Information"
                        badge={<DirtyBadge count={dirtyFields.filter(f => ["title", "description", "durationMinutes", "releaseDate", "language", "ageRestriction", "trailerUrl"].includes(f)).length} />}
                    >
                        <Field label="Title" required error={errors.title} dirty={dirtyFields.includes("title")}>
                            <input
                                type="text"
                                value={form.title}
                                onChange={set("title")}
                                placeholder="e.g. Interstellar"
                                className={`field field-filled w-full ${errors.title ? "field-error" : ""}`}
                            />
                        </Field>

                        <Field
                            label="Description"
                            hint="A short synopsis shown to users on the movie page."
                            dirty={dirtyFields.includes("description")}
                        >
                            <textarea
                                value={form.description}
                                onChange={set("description")}
                                rows={4}
                                placeholder="Write a compelling synopsis…"
                                className="field field-filled w-full resize-none"
                            />
                        </Field>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Duration (minutes)" required error={errors.durationMinutes} dirty={dirtyFields.includes("durationMinutes")}>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted) pointer-events-none" />
                                    <input
                                        type="number"
                                        value={form.durationMinutes}
                                        onChange={set("durationMinutes")}
                                        placeholder="120"
                                        min="1"
                                        className={`field field-filled w-full pl-9 ${errors.durationMinutes ? "field-error" : ""}`}
                                    />
                                </div>
                            </Field>

                            <Field label="Release Date" dirty={dirtyFields.includes("releaseDate")}>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted) pointer-events-none" />
                                    <input
                                        type="date"
                                        value={form.releaseDate}
                                        onChange={set("releaseDate")}
                                        className="field field-filled w-full pl-9"
                                    />
                                </div>
                            </Field>

                            <Field label="Language" required error={errors.language} dirty={dirtyFields.includes("language")}>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted) pointer-events-none" />
                                    <input
                                        type="text"
                                        value={form.language}
                                        onChange={set("language")}
                                        placeholder="e.g. English, Urdu"
                                        className={`field field-filled w-full pl-9 ${errors.language ? "field-error" : ""}`}
                                    />
                                </div>
                            </Field>

                            <Field
                                label="Age Restriction"
                                hint="Leave blank if unrated."
                                error={errors.ageRestriction}
                                dirty={dirtyFields.includes("ageRestriction")}
                            >
                                <div className="relative">
                                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted) pointer-events-none" />
                                    <input
                                        type="number"
                                        value={form.ageRestriction}
                                        onChange={set("ageRestriction")}
                                        placeholder="e.g. 13"
                                        min="0"
                                        className={`field field-filled w-full pl-9 ${errors.ageRestriction ? "field-error" : ""}`}
                                    />
                                </div>
                            </Field>
                        </div>

                        <Field
                            label="Trailer URL"
                            hint="YouTube or any direct video URL."
                            error={errors.trailerUrl}
                            dirty={dirtyFields.includes("trailerUrl")}
                        >
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted) pointer-events-none" />
                                <input
                                    type="url"
                                    value={form.trailerUrl}
                                    onChange={set("trailerUrl")}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className={`field field-filled w-full pl-9 ${errors.trailerUrl ? "field-error" : ""}`}
                                />
                            </div>
                        </Field>
                    </Section>

                    {/* Genres */}
                    <Section
                        icon={Tag}
                        title="Genres"
                        badge={<DirtyBadge count={dirtyFields.includes("genreIds") ? 1 : 0} />}
                    >
                        <GenrePicker
                            genres={genres}
                            selected={form.genreIds}
                            onChange={(ids) => setForm((f) => ({ ...f, genreIds: ids }))}
                        />
                        <p className="text-xs text-(--color-text-muted)">
                            {form.genreIds.length > 0
                                ? `${form.genreIds.length} genre${form.genreIds.length > 1 ? "s" : ""} selected`
                                : "No genres selected — pick at least one for better discoverability."}
                        </p>
                    </Section>

                    {/* Banner */}
                    <Section
                        icon={ImagePlus}
                        title="Banner Image"
                        badge={bannerFile || (bannerPreview !== (movie?.bannerUrl ?? null)) ? <DirtyBadge count={1} /> : null}
                    >
                        <p className="text-sm text-(--color-text-muted) -mt-2">
                            Wide hero image displayed at the top of the movie detail page. Recommended: 1920×600.
                        </p>
                        <ImageUploadZone
                            label="Banner"
                            hint="PNG, JPG up to 5MB · 1920×600 recommended"
                            name="banner"
                            preview={bannerPreview}
                            isExisting={bannerIsExisting}
                            existingUrl={movie?.bannerUrl}
                            onFileChange={setImageFile("banner")}
                            onClear={clearImage("banner")}
                            onRestoreExisting={restoreExisting("banner")}
                            aspect="banner"
                        />
                    </Section>
                </div>

                {/* ── RIGHT COLUMN ─────────────────────────────── */}
                <div className="space-y-5">

                    {/* Status */}
                    <Section
                        icon={CheckCircle2}
                        title="Status"
                        badge={<DirtyBadge count={dirtyFields.includes("status") ? 1 : 0} />}
                    >
                        <div className="space-y-2">
                            {statuses.map((s) => {
                                const active = form.status === s;
                                return (
                                    <label
                                        key={s}
                                        className={[
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150",
                                            active
                                                ? "border-(--color-accent) bg-(--color-accent-dim)"
                                                : "border-(--color-border-default) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)",
                                        ].join(" ")}
                                    >
                                        <input
                                            type="radio"
                                            name="status"
                                            value={s}
                                            checked={active}
                                            onChange={set("status")}
                                            className="hidden"
                                        />
                                        <div className={[
                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                            active ? "border-(--color-accent) bg-(--color-accent)" : "border-(--color-border-strong)",
                                        ].join(" ")}>
                                            {active && <div className="w-1.5 h-1.5 rounded-full bg-(--color-accent-text)" />}
                                        </div>
                                        <p className={`text-sm font-medium ${active ? "text-(--color-text-primary)" : "text-(--color-text-muted)"}`}>
                                            {s}
                                        </p>
                                    </label>
                                );
                            })}
                        </div>
                    </Section>

                    {/* Poster */}
                    <Section
                        icon={ImagePlus}
                        title="Poster Image"
                        badge={posterFile || (posterPreview !== (movie?.posterUrl ?? null)) ? <DirtyBadge count={1} /> : null}
                    >
                        <p className="text-xs text-(--color-text-muted) -mt-1">
                            Shown in listings and search results. Recommended: 500×750.
                        </p>
                        <ImageUploadZone
                            label="Poster"
                            hint="PNG, JPG · 500×750"
                            name="poster"
                            preview={posterPreview}
                            isExisting={posterIsExisting}
                            existingUrl={movie?.posterUrl}
                            onFileChange={setImageFile("poster")}
                            onClear={clearImage("poster")}
                            onRestoreExisting={restoreExisting("poster")}
                            aspect="poster"
                        />
                    </Section>

                    {/* Live summary */}
                    <div className="card rounded-xl p-4 space-y-3 bg-(--color-surface-raised) border-(--color-border-subtle) sticky top-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest">
                                Current Values
                            </p>
                            {totalChanges > 0 && (
                                <span className="text-xs text-(--color-warning)">Unsaved</span>
                            )}
                        </div>

                        <div className="space-y-2 text-sm">
                            <SummaryRow label="Title" current={original.title} next={form.title} />
                            <SummaryRow
                                label="Duration"
                                current={original.durationMinutes ? `${original.durationMinutes} min` : "—"}
                                next={form.durationMinutes ? `${form.durationMinutes} min` : "—"}
                            />
                            <SummaryRow label="Language" current={original.language} next={form.language} />
                            <SummaryRow
                                label="Status"
                                current={statuses.find(s => s === original.status) ?? "—"}
                                next={statuses.find(s => s === form.status) ?? "—"}
                            />
                            <SummaryRow
                                label="Genres"
                                current={original.genreIds.length > 0
                                    ? genres.filter(g => original.genreIds.includes(g.id)).map(g => g.name).join(", ")
                                    : "—"}
                                next={form.genreIds.length > 0
                                    ? genres.filter(g => form.genreIds.includes(g.id)).map(g => g.name).join(", ")
                                    : "—"}
                            />
                        </div>

                        {/* Image change summary */}
                        {imagesDirty && (
                            <div className="pt-2 border-t border-(--color-border-subtle) space-y-1">
                                {posterFile && (
                                    <p className="text-xs text-(--color-success) flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> New poster attached
                                    </p>
                                )}
                                {!posterFile && posterPreview !== (movie?.posterUrl ?? null) && (
                                    <p className="text-xs text-(--color-danger) flex items-center gap-1">
                                        <X className="w-3 h-3" /> Poster removed
                                    </p>
                                )}
                                {bannerFile && (
                                    <p className="text-xs text-(--color-success) flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> New banner attached
                                    </p>
                                )}
                                {!bannerFile && bannerPreview !== (movie?.bannerUrl ?? null) && (
                                    <p className="text-xs text-(--color-danger) flex items-center gap-1">
                                        <X className="w-3 h-3" /> Banner removed
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

/* ─── SummaryRow — shows before/after on change ───────────────── */
const SummaryRow = ({ label, current, next }) => {
    const changed = current !== next;
    return (
        <div className="space-y-0.5">
            <span className="text-xs text-(--color-text-disabled) uppercase tracking-wider">{label}</span>
            {changed ? (
                <div className="space-y-0.5">
                    <p className="text-xs text-(--color-text-muted) line-through truncate">{current || "—"}</p>
                    <p className="text-sm font-medium text-(--color-success) truncate">{next || "—"}</p>
                </div>
            ) : (
                <p className="text-sm font-medium text-(--color-text-secondary) truncate">{current || "—"}</p>
            )}
        </div>
    );
};

export default EditMoviePage;
