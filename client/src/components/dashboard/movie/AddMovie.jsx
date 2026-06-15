"use client";

import React, { useState, useRef } from "react";
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
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createMovie } from "@/actions/movies.action";
import { useAuthStore } from "@/store/authStore";

/* ─── ImageUploadZone ─────────────────────────────────────────── */
const ImageUploadZone = ({ label, hint, name, preview, onFileChange, onClear, aspect = "poster" }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileChange(file);
    };

    const isPoster = aspect === "poster";

    return (
        <div className="space-y-2">
            <label className="label">{label}</label>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !preview && inputRef.current?.click()}
                className={[
                    "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center",
                    isPoster ? "h-64 w-44" : "h-40 w-full",
                    preview ? "border-transparent cursor-default" : "cursor-pointer",
                    dragging
                        ? "border-(--color-accent) bg-(--color-accent-dim)"
                        : preview
                            ? "border-(--color-border-subtle)"
                            : "border-(--color-border-default) bg-(--color-surface) hover:border-(--color-purple-bright) hover:bg-(--color-surface-hover)",
                ].join(" ")}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                                className="btn btn-sm bg-white/10 text-white border border-white/20 backdrop-blur-sm hover:bg-white/20"
                            >
                                <Upload className="w-3.5 h-3.5" /> Replace
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onClear(); }}
                                className="btn btn-sm bg-white/10 text-white border border-white/20 backdrop-blur-sm hover:bg-(--color-danger-dim)"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center pointer-events-none">
                        <div className="w-10 h-10 rounded-lg bg-(--color-purple-dim) flex items-center justify-center">
                            <ImagePlus className="w-5 h-5 text-(--color-purple-bright)" />
                        </div>
                        <p className="text-sm text-(--color-text-muted)">
                            <span className="text-(--color-info) font-medium">Click to upload</span>
                            {" "}or drag & drop
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
            : [...selected, id]
        );
    };

    return (
        <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
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

/* ─── Section wrapper ─────────────────────────────────────────── */
const Section = ({ icon: Icon, title, children }) => (
    <div className="card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-1 border-b border-(--color-border-subtle)">
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

/* ─── Field wrapper ───────────────────────────────────────────── */
const Field = ({ label, hint, error, children, required }) => (
    <div className="space-y-1.5">
        <label className="label">
            {label}
            {required && <span className="text-(--color-danger) ml-0.5">*</span>}
        </label>
        {children}
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error-msg">{error}</p>}
    </div>
);

/* ─── AddMovie ────────────────────────────────────────────── */
const AddMovie = ({ genres, status }) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        durationMinutes: "",
        releaseDate: "",
        language: "",
        ageRestriction: "",
        trailerUrl: "",
        status: "COMING_SOON",
        genreIds: [],
    });

    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    const [errors, setErrors] = useState({});
    const { user } = useAuthStore();

    /* ── Helpers ──────────────────────────────────────────────── */
    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const setFile = (type) => (file) => {
        const url = URL.createObjectURL(file);
        if (type === "poster") { setPosterFile(file); setPosterPreview(url); }
        else { setBannerFile(file); setBannerPreview(url); }
    };

    const clearFile = (type) => () => {
        if (type === "poster") { setPosterFile(null); setPosterPreview(null); }
        else { setBannerFile(null); setBannerPreview(null); }
    };

    /* ── Validation ───────────────────────────────────────────── */
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

    /* ── Submit ───────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fix the errors before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title.trim());
            fd.append("description", form.description.trim());
            fd.append("durationMinutes", form.durationMinutes);
            fd.append("language", form.language.trim());
            fd.append("status", form.status);
            if (form.releaseDate) fd.append("releaseDate", form.releaseDate);
            if (form.ageRestriction) fd.append("ageRestriction", form.ageRestriction);
            if (form.trailerUrl) fd.append("trailerUrl", form.trailerUrl.trim());
            if (form.genreIds.length > 0) fd.append("genreIds", JSON.stringify(form.genreIds));
            if (posterFile) fd.append("poster", posterFile);
            if (bannerFile) fd.append("banner", bannerFile);

            await createMovie(fd);
            toast.success("Movie created successfully!");
            router.push(`/${user?.role}/dashboard/movies`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">

            {/* ── Page Header ────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Movies
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-(--color-accent-dim) border border-(--color-border-accent) flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-(--color-accent)" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-(--color-text-primary) tracking-tight leading-none">
                                Add New Movie
                            </h1>
                            <p className="text-sm text-(--color-text-muted) mt-0.5">
                                Fill in the details below to list a new film.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn btn-sm btn-ghost"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="new-movie-form"
                        className="btn btn-sm btn-primary shadow-[0_0_16px_rgba(254,229,5,0.2)]"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            : <><Film className="w-4 h-4" /> Publish Movie</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Form ───────────────────────────────────────── */}
            <form id="new-movie-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT COLUMN ──────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Core Info */}
                    <Section icon={Film} title="Core Information">
                        <Field label="Title" required error={errors.title}>
                            <input
                                type="text"
                                value={form.title}
                                onChange={set("title")}
                                placeholder="e.g. Interstellar"
                                className={`field field-filled w-full ${errors.title ? "field-error" : ""}`}
                            />
                        </Field>

                        <Field label="Description" hint="A short synopsis shown to users on the movie page.">
                            <textarea
                                value={form.description}
                                onChange={set("description")}
                                rows={4}
                                placeholder="Write a compelling synopsis…"
                                className="field field-filled w-full resize-none"
                            />
                        </Field>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Duration (minutes)" required error={errors.durationMinutes}>
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

                            <Field label="Release Date">
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

                            <Field label="Language" required error={errors.language}>
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

                            <Field label="Age Restriction" hint="Leave blank if unrated." error={errors.ageRestriction}>
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

                        <Field label="Trailer URL" hint="YouTube or any direct video URL." error={errors.trailerUrl}>
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
                    <Section icon={Tag} title="Genres">
                        <GenrePicker
                            genres={genres}
                            selected={form.genreIds}
                            onChange={(ids) => setForm((f) => ({ ...f, genreIds: ids }))}
                        />
                        {form.genreIds.length > 0 && (
                            <p className="text-xs text-(--color-text-muted) mt-1">
                                {form.genreIds.length} genre{form.genreIds.length > 1 ? "s" : ""} selected
                            </p>
                        )}
                    </Section>

                    {/* Banner */}
                    <Section icon={ImagePlus} title="Banner Image">
                        <p className="text-sm text-(--color-text-muted) -mt-2">
                            Wide hero image displayed at the top of the movie detail page. Recommended: 1920×600.
                        </p>
                        <ImageUploadZone
                            label="Banner"
                            hint="PNG, JPG up to 5MB · 1920×600 recommended"
                            name="banner"
                            preview={bannerPreview}
                            onFileChange={setFile("banner")}
                            onClear={clearFile("banner")}
                            aspect="banner"
                        />
                    </Section>
                </div>

                {/* ── RIGHT COLUMN ─────────────────────────────── */}
                <div className="space-y-5">

                    {/* Status */}
                    <Section icon={CheckCircle2} title="Status">
                        <div className="space-y-2">
                            {status.map((s) => (
                                <label
                                    key={s}
                                    className={[
                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150",
                                        form.status === s
                                            ? "border-(--color-accent) bg-(--color-accent-dim)"
                                            : "border-(--color-border-default) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)",
                                    ].join(" ")}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={s}
                                        checked={form.status === s}
                                        onChange={set("status")}
                                        className="hidden"
                                    />
                                    <div className={[
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                        form.status === s
                                            ? "border-(--color-accent) bg-(--color-accent)"
                                            : "border-(--color-border-strong)",
                                    ].join(" ")}>
                                        {form.status === s && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-(--color-accent-text)" />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${form.status === s ? "text-(--color-text-primary)" : "text-(--color-text-muted)"}`}>
                                        {s}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </Section>

                    {/* Poster */}
                    <Section icon={ImagePlus} title="Poster Image">
                        <p className="text-xs text-(--color-text-muted) -mt-1">
                            Shown in listings. Recommended: 500×750.
                        </p>
                        <ImageUploadZone
                            label="Poster"
                            hint="PNG, JPG · 500×750"
                            name="poster"
                            preview={posterPreview}
                            onFileChange={setFile("poster")}
                            onClear={clearFile("poster")}
                            aspect="poster"
                        />
                    </Section>

                    {/* Summary card */}
                    <div className="card rounded-xl p-4 space-y-3 bg-(--color-surface-raised) border-(--color-border-subtle) sticky top-4">
                        <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-widest">Summary</p>
                        <div className="space-y-2 text-sm">
                            <Row label="Title" value={form.title || "—"} />
                            <Row label="Duration" value={form.durationMinutes ? `${form.durationMinutes} min` : "—"} />
                            <Row label="Language" value={form.language || "—"} />
                            <Row label="Status" value={status.find(s => s === form.status) ?? "—"} />
                            <Row label="Genres" value={form.genreIds.length > 0
                                ? genres.filter(g => form.genreIds.includes(g.id)).map(g => g.name).join(", ")
                                : "—"} />
                            <Row label="Poster" value={posterFile ? "✓ Attached" : "—"} highlight={!!posterFile} />
                            <Row label="Banner" value={bannerFile ? "✓ Attached" : "—"} highlight={!!bannerFile} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

const Row = ({ label, value, highlight }) => (
    <div className="flex justify-between gap-2 items-start">
        <span className="text-(--color-text-muted) shrink-0">{label}</span>
        <span className={`text-right font-medium truncate max-w-[180px] ${highlight ? "text-(--color-success)" : "text-(--color-text-secondary)"}`}>
            {value}
        </span>
    </div>
);

export default AddMovie;
