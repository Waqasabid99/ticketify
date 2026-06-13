"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
    Calendar,
    Clock,
    Globe,
    Play,
    Ticket,
    Star,
    Users,
    Film,
} from "lucide-react";
import { formatDuration, formatYear, StarRating, StatusBadge } from "@/utils/constants";
import MovieCard from "../ui/MovieCard";

function SectionHeader({ eyebrow, title, action }) {
    return (
        <div className="flex items-end justify-between mb-6">
            <div className="flex flex-col gap-1">
                <span className="eyebrow">{eyebrow}</span>
                <h2 className="text-2xl font-(family-name:--font-display) text-(--color-text-primary) font-(--font-bold) m-0 tracking-(--tracking-snug)">
                    {title}
                </h2>
            </div>
            {action && action}
        </div>
    );
}

const MovieDetailPage = ({ movie, relatedMovies = [] }) => {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const castRef = useRef(null);

    const genres = movie.genres?.map((g) => g.genre?.name ?? g.name).filter(Boolean) ?? [];
    const year = formatYear(movie.releaseDate);
    const duration = formatDuration(movie.durationMinutes);

    return (
        <main className="bg-(--color-bg-page) min-h-screen text-(--color-text-secondary) font-(family-name:--font-body)">

            {/* ══════════════════════════════════════
                HERO — cinematic banner with layers
            ══════════════════════════════════════ */}
            <section className="relative min-h-[92vh] overflow-hidden flex items-end">

                {/* Banner image */}
                <Image
                    src={movie.bannerUrl}
                    alt={movie.title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-top"
                />

                {/* Gradient overlays — vignette from left + bottom */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to right, rgba(10,6,30,0.95) 0%, rgba(10,6,30,0.55) 50%, rgba(10,6,30,0.15) 100%)",
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to top, var(--color-void) 0%, rgba(10,6,30,0.5) 35%, transparent 65%)",
                    }}
                />

                {/* ── Hero content ── */}
                <div className="relative z-10 w-full max-w-xl mx-auto px-(--space-6) pb-(--space-16) grid grid-cols-1 md:grid-cols-[auto_1fr] gap-(--space-8)">

                    {/* Info */}
                    <div className="flex flex-col gap-(--space-4) self-end">

                        {/* Genre + status pills */}
                        <div className="flex items-center gap-(--space-2) flex-wrap">
                            {genres.map((g) => (
                                <span
                                    key={g}
                                    className="text-xs text-(--color-info) font-(--font-semibold) tracking-wider uppercase py-[3px] px-[10px] rounded-full bg-(--color-info-dim) border border-[rgba(55,198,243,0.2)]"
                                >
                                    {g}
                                </span>
                            ))}
                            <StatusBadge status={movie.status} />
                        </div>

                        {/* Title */}
                        <h1 className="font-(family-name:--font-display) text-[clamp(2.5rem,6vw,4.5rem)] font-(--font-extrabold) text-(--color-text-primary) tracking-tight leading-tight m-0">
                            {movie.title}
                        </h1>

                        {/* Meta row */}
                        <div className="flex items-center gap-(--space-5) flex-wrap text-(--color-text-muted) text-sm">
                            {year && (
                                <span className="flex items-center gap-(--space-1)">
                                    <Calendar size={14} />
                                    {year}
                                </span>
                            )}
                            {duration && (
                                <span className="flex items-center gap-(--space-1)">
                                    <Clock size={14} />
                                    {duration}
                                </span>
                            )}
                            {movie.language && (
                                <span className="flex items-center gap-(--space-1)">
                                    <Globe size={14} />
                                    {movie.language}
                                </span>
                            )}
                            {movie.ageRestriction && (
                                <span className="py-[2px] px-[8px] border border-(--color-border-strong) rounded-sm text-(--text-xs) font-(--font-semibold) tracking-wide">
                                    {movie.ageRestriction}+
                                </span>
                            )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-(--space-3)">
                            <StarRating rating={4} />
                            <span className="text-sm text-(--color-text-muted)">
                                4.0 / 5.0
                            </span>
                        </div>

                        {/* Description — truncated */}
                        <p className="text-(--color-text-secondary) leading-relaxed max-w-[600px] m-0 line-clamp-3">
                            {movie.description}
                        </p>

                        {/* CTA row */}
                        <div className="flex items-center gap-(--space-3) flex-wrap mt-(--space-2)">
                            <Link
                                href={`/movie/${movie.slug}/book`}
                                className="btn link-button"
                            >
                                <Ticket size={16} />
                                Book Tickets
                            </Link>

                            {movie.trailerUrl && (
                                <Link
                                    href={movie.trailerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn link-button-info border border-(--color-info)"
                                >
                                    <Play size={16} />
                                    Watch Trailer
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                BODY — content sections
            ══════════════════════════════════════ */}
            <div className="max-w-xl mx-auto px-(--space-6)">

                {/* ── Stats strip ── */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-px bg-(--color-border-subtle) rounded-xl overflow-hidden border border-(--color-border-subtle) -mt-(--space-8) mb-(--space-16) relative z-10">
                    {[
                        { icon: <Star size={16} />, label: "Rating", value: "4.0 / 5" },
                        { icon: <Users size={16} />, label: "Cast", value: `${movie.casts?.length ?? 0} Members` },
                        { icon: <Clock size={16} />, label: "Runtime", value: duration ?? "—" },
                        { icon: <Film size={16} />, label: "Status", value: movie.status?.replace(/_/g, " ") },
                    ].map(({ icon, label, value }) => (
                        <div
                            key={label}
                            className="bg-(--color-surface) p-(--space-5) px-(--space-6) flex flex-col gap-(--space-2)"
                        >
                            <span className="text-(--color-accent) flex items-center gap-(--space-1)">
                                {icon}
                            </span>
                            <span className="text-xs text-(--color-text-muted) uppercase tracking-widest font-(--font-semibold)">
                                {label}
                            </span>
                            <span className="text-(--color-text-primary) font-(--font-semibold) font-(family-name:--font-display)">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Overview + Scores two-column ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-(--space-8) mb-(--space-16)">

                    {/* Synopsis */}
                    <div>
                        <SectionHeader eyebrow="The Story" title="Synopsis" />
                        <p className="text-md text-(--color-text-secondary) leading-relaxed m-0">
                            {movie.description}
                        </p>

                        {/* Quick details grid */}
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-(--space-4)">
                            {[
                                { label: "Release Date", value: movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                                { label: "Language", value: movie.language ?? "—" },
                                { label: "Duration", value: duration ?? "—" },
                                { label: "Age Rating", value: movie.ageRestriction ? `${movie.ageRestriction}+` : "All Ages" },
                            ].map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="p-(--space-4) bg-(--color-surface) rounded-lg border border-(--color-border-subtle)"
                                >
                                    <span className="block text-xs text-(--color-text-muted) uppercase tracking-widest font-(--font-semibold) mb-(--space-1)">
                                        {label}
                                    </span>
                                    <span className="text-(--color-text-primary) font-(--font-medium)">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Cast ── */}
                <section className="mb-(--space-16)">
                    <SectionHeader
                        eyebrow="The Talent"
                        title="Cast & Crew"
                        action={
                            <button
                                onClick={() => castRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
                                className="bg-(--color-surface) border border-(--color-border-default) rounded-md text-(--color-text-muted) py-(--space-2) px-(--space-4) cursor-pointer text-sm font-(--font-medium) transition-all duration-(--transition-fast) hover:text-(--color-text-primary) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"
                            >
                                See All →
                            </button>
                        }
                    />

                    {/* Horizontal scrolling cast rail */}
                    <div
                        ref={castRef}
                        className="flex gap-(--space-4) overflow-x-auto pb-(--space-3) scrollbar-thin [scrollbar-color:var(--color-border-default)_transparent]"
                    >
                        {movie.casts?.map((cast) => (
                            <div key={cast.id} className="shrink-0 w-[150px]">
                                {/* Poster / avatar */}
                                <div className="w-[150px] h-[150px] rounded-xl overflow-hidden bg-(--color-surface-raised) border border-(--color-border-subtle) mb-(--space-3) flex items-center justify-center relative">
                                    {cast.imageUrl ? (
                                        <Image
                                            src={cast.imageUrl}
                                            alt={cast.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="font-(family-name:--font-display) text-3xl font-bold text-(--color-purple-bright) tracking-tight">
                                            {cast.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join("")}
                                        </span>
                                    )}
                                </div>

                                <Link
                                    href={`/cast/${cast.slug}`}
                                    className="link-logo block text-sm font-(--font-semibold) text-(--color-text-primary) mb-(--space-1) no-underline whitespace-nowrap overflow-hidden text-ellipsis"
                                >
                                    {cast.name}
                                </Link>
                                <span className="block text-xs text-(--color-text-muted) whitespace-nowrap overflow-hidden text-ellipsis">
                                    {cast.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Trailer section ── */}
                {movie.trailerUrl && (
                    <section className="mb-(--space-16)">
                        <SectionHeader eyebrow="Preview" title="Official Trailer" />
                        <div className="rounded-2xl overflow-hidden border border-(--color-border-subtle) shadow-(--shadow-xl) relative aspect-video bg-(--color-void-deep)">
                            {/* Poster as thumbnail with play overlay */}
                            <Image
                                src={movie.bannerUrl}
                                alt="Trailer thumbnail"
                                fill
                                className="object-cover opacity-60"
                            />
                            <Link
                                href={movie.trailerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex flex-col items-center justify-center gap-(--space-4) no-underline"
                            >
                                <div
                                    className="w-[72px] h-[72px] rounded-full bg-(--color-accent) flex items-center justify-center shadow-(--shadow-glow-accent) transition-transform duration-(--transition-bounce) hover:scale-110"
                                >
                                    <Play
                                        size={28}
                                        fill="var(--color-accent-text)"
                                        color="var(--color-accent-text)"
                                        className="ml-[4px]"
                                    />
                                </div>
                                <span className="font-(family-name:--font-display) text-xl font-(--font-bold) text-(--color-text-primary) tracking-(--tracking-snug)">
                                    Watch on YouTube
                                </span>
                            </Link>
                        </div>
                    </section>
                )}

                {/* ── Related movies ── */}
                {relatedMovies.length > 0 && (
                    <section className="mb-(--space-16)">
                        <SectionHeader eyebrow="More Like This" title="You Might Also Enjoy" />
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-(--space-5)">
                            {relatedMovies.map((m) => (
                                <MovieCard key={m.id} movie={m} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Bottom booking banner ── */}
                <section className="mb-(--space-20) rounded-2xl overflow-hidden relative py-(--space-12) px-(--space-8) bg-(--color-surface) border border-(--color-border-subtle) flex flex-col items-center text-center gap-(--space-4)">

                    {/* Glow background */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse 60% 70% at 50% 120%, rgba(254,229,5,0.08) 0%, transparent 70%)",
                        }}
                    />

                    {/* Accent top line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[2px] bg-(--color-accent) rounded-full" />

                    <span className="eyebrow">Now Available</span>
                    <h2 className="text-(--color-text-primary) m-0 tracking-tight">
                        Ready to watch {movie.title}?
                    </h2>
                    <p className="text-(--color-text-muted) max-w-[480px] m-0 leading-relaxed">
                        Secure your seats now. Choose your showtime, pick your seats, and enjoy the show.
                    </p>
                    <div className="flex gap-(--space-3) flex-wrap justify-center mt-(--space-2)">
                        <Link
                            href={`/movie/${movie.slug}/book`}
                            className="btn link-button"
                        >
                            <Ticket size={18} />
                            Book Tickets
                        </Link>
                        {movie.trailerUrl && (
                            <Link
                                href={movie.trailerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn link-button-info border border-(--color-border-info)"
                            >
                                <Play size={18} />
                                Watch Trailer
                            </Link>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default MovieDetailPage;
