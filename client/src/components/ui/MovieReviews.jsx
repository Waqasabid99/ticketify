"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ChevronDown,
    Loader2,
    MessageSquareText,
    Pencil,
    ShieldCheck,
    Star,
    Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    createReview,
    deleteOwnReview,
    getMovieReviews,
    getOwnReview,
    updateOwnReview,
} from "@/actions/review.action";

const PAGE_SIZE = 5;

const STATUS_META = {
    PENDING: { label: "Pending Review", className: "text-(--color-text-muted)" },
    APPROVED: { label: "Published", className: "text-(--color-accent)" },
    REJECTED: { label: "Not Approved", className: "text-red-400" },
};

function timeAgo(dateString) {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const units = [
        ["year", 31536000],
        ["month", 2592000],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
    ];
    for (const [label, secondsInUnit] of units) {
        const count = Math.floor(seconds / secondsInUnit);
        if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
    return "Just now";
}

/* ── Read-only 5-star renderer for a value out of `max` ───────────────── */
export function StarsDisplay({ value = 0, max = 10, size = 14 }) {
    const fiveScale = (value / max) * 5;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
                const fill = Math.min(1, Math.max(0, fiveScale - i));
                return (
                    <span
                        key={i}
                        className="relative inline-block shrink-0"
                        style={{ width: size, height: size }}
                    >
                        <Star size={size} className="absolute inset-0 text-(--color-border-strong)" />
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                            <Star size={size} fill="var(--color-accent)" color="var(--color-accent)" />
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

/* ── Interactive picker — 5 stars, half-star precision = 1-10 scale ───── */
function StarPicker({ value, onChange }) {
    const [hoverValue, setHoverValue] = useState(null);
    const display = hoverValue ?? value ?? 0;

    const resolve = (e, starIndex) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftHalf = e.clientX - rect.left < rect.width / 2;
        return starIndex * 2 + (isLeftHalf ? 1 : 2);
    };

    return (
        <div className="flex items-center gap-(--space-3)" onMouseLeave={() => setHoverValue(null)}>
            <div className="flex items-center gap-(--space-1)">
                {Array.from({ length: 5 }).map((_, i) => {
                    const fill = Math.min(1, Math.max(0, display / 2 - i));
                    return (
                        <button
                            key={i}
                            type="button"
                            className="relative inline-block cursor-pointer p-0 bg-transparent border-0"
                            style={{ width: 28, height: 28 }}
                            onMouseMove={(e) => setHoverValue(resolve(e, i))}
                            onClick={(e) => onChange(resolve(e, i))}
                            aria-label={`Rate ${i * 2 + 1} or ${i * 2 + 2} out of 10`}
                        >
                            <Star size={28} className="absolute inset-0 text-(--color-border-strong)" />
                            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                                <Star size={28} fill="var(--color-accent)" color="var(--color-accent)" />
                            </span>
                        </button>
                    );
                })}
            </div>
            <span className="text-sm text-(--color-text-muted) font-(--font-medium) tabular-nums">
                {display > 0 ? `${display} / 10` : "Tap to rate"}
            </span>
        </div>
    );
}

function ReviewCard({ review }) {
    const name =
        [review.user?.firstName, review.user?.lastName].filter(Boolean).join(" ") || "Anonymous";
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="p-(--space-5) bg-(--color-surface) border border-(--color-border-subtle) rounded-xl flex flex-col gap-(--space-3)">
            <div className="flex items-center justify-between flex-wrap gap-(--space-3)">
                <div className="flex items-center gap-(--space-3)">
                    <div className="w-9 h-9 rounded-full bg-(--color-surface-raised) border border-(--color-border-subtle) flex items-center justify-center text-xs font-(--font-bold) text-(--color-purple-bright) font-(family-name:--font-display) shrink-0">
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-(--font-semibold) text-(--color-text-primary)">{name}</span>
                        <span className="text-xs text-(--color-text-muted)">{timeAgo(review.createdAt)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-(--space-3)">
                    {review.verified && (
                        <span className="flex items-center gap-(--space-1) text-xs text-(--color-info) font-(--font-medium)">
                            <ShieldCheck size={13} />
                            Verified Viewer
                        </span>
                    )}
                    <StarsDisplay value={review.rating} max={10} size={14} />
                </div>
            </div>
            {review.review && (
                <p className="text-sm text-(--color-text-secondary) leading-relaxed m-0">{review.review}</p>
            )}
        </div>
    );
}

const MovieReviews = ({ movieId }) => {
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [ownReview, setOwnReview] = useState(null);
    const [ownLoading, setOwnLoading] = useState(true);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formRating, setFormRating] = useState(0);
    const [formText, setFormText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const loadReviews = useCallback(
        async (targetPage, replace) => {
            replace ? setLoading(true) : setLoadingMore(true);
            const data = await getMovieReviews(movieId, { page: targetPage, limit: PAGE_SIZE });
            if (data) {
                setStats(data.stats ?? null);
                setReviews((prev) => (replace ? data.reviews ?? [] : [...prev, ...(data.reviews ?? [])]));
                setTotalPages(data.totalPages ?? 1);
                setPage(data.page ?? targetPage);
            }
            setLoading(false);
            setLoadingMore(false);
        },
        [movieId]
    );

    useEffect(() => {
        loadReviews(1, true);
    }, [loadReviews]);

    useEffect(() => {
        let active = true;
        (async () => {
            setOwnLoading(true);
            const mine = await getOwnReview(movieId);
            if (active) {
                setOwnReview(mine);
                setOwnLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [movieId]);

    const openNewReviewForm = () => {
        setEditing(false);
        setFormRating(0);
        setFormText("");
        setFormOpen(true);
    };

    const openEditForm = () => {
        setEditing(true);
        setFormRating(ownReview?.rating ?? 0);
        setFormText(ownReview?.review ?? "");
        setFormOpen(true);
    };

    const handleSubmit = async () => {
        if (formRating < 1) {
            toast.error("Please select a rating before submitting.");
            return;
        }
        setSubmitting(true);
        const ok = editing
            ? await updateOwnReview(movieId, { rating: formRating, review: formText.trim() || undefined })
            : await createReview({ movieId, rating: formRating, review: formText.trim() || undefined });
        setSubmitting(false);

        if (!ok) {
            toast.error(
                editing
                    ? "Couldn't update your review. Please try again."
                    : "Couldn't submit your review. Make sure you're logged in and try again."
            );
            return;
        }

        toast.success(editing ? "Review updated." : "Thanks for your review! It'll appear once approved.");
        setFormOpen(false);
        setOwnReview(await getOwnReview(movieId));
        loadReviews(1, true);
    };

    const handleDelete = async () => {
        setSubmitting(true);
        const ok = await deleteOwnReview(movieId);
        setSubmitting(false);
        setConfirmingDelete(false);

        if (!ok) {
            toast.error("Couldn't delete your review. Please try again.");
            return;
        }

        toast.success("Review deleted.");
        setOwnReview(null);
        loadReviews(1, true);
    };

    const breakdown = stats?.breakdown ?? [];
    const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

    return (
        <section className="mb-(--space-16)">
            <div className="flex items-end justify-between mb-6 flex-wrap gap-(--space-4)">
                <div className="flex flex-col gap-1">
                    <span className="eyebrow">What People Think</span>
                    <h2 className="text-2xl font-(family-name:--font-display) text-(--color-text-primary) font-(--font-bold) m-0 tracking-(--tracking-snug)">
                        Ratings &amp; Reviews
                    </h2>
                </div>
                {!ownLoading && !ownReview && !formOpen && (
                    <button onClick={openNewReviewForm} className="btn link-button">
                        <MessageSquareText size={16} />
                        Write a Review
                    </button>
                )}
            </div>

            {/* ── Stats summary ── */}
            {loading ? (
                <div className="h-35 bg-(--color-surface) border border-(--color-border-subtle) rounded-xl mb-(--space-8) animate-pulse" />
            ) : stats && stats.totalReviews > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-(--space-8) p-(--space-6) bg-(--color-surface) border border-(--color-border-subtle) rounded-xl mb-(--space-8)">
                    <div className="flex flex-col items-center justify-center gap-(--space-2) md:border-r md:border-(--color-border-subtle) md:pr-(--space-8)">
                        <span className="text-5xl font-(family-name:--font-display) font-(--font-extrabold) text-(--color-text-primary) leading-none">
                            {stats.averageRating?.toFixed(1) ?? "—"}
                        </span>
                        <StarsDisplay value={stats.averageRating ?? 0} max={10} size={18} />
                        <span className="text-xs text-(--color-text-muted) uppercase tracking-widest font-(--font-semibold)">
                            {stats.totalReviews} {stats.totalReviews === 1 ? "Review" : "Reviews"}
                        </span>
                    </div>
                    <div className="flex flex-col gap-(--space-1) justify-center">
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => {
                            const count = breakdown.find((b) => b.rating === r)?.count ?? 0;
                            const pct = (count / maxCount) * 100;
                            return (
                                <div key={r} className="flex items-center gap-(--space-2)">
                                    <span className="text-xs text-(--color-text-muted) w-4.5 text-right tabular-nums">
                                        {r}
                                    </span>
                                    <div className="flex-1 h-1.5 rounded-full bg-(--color-border-subtle) overflow-hidden">
                                        <div
                                            className="h-full bg-(--color-accent) rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-(--color-text-muted) w-6 tabular-nums">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="p-(--space-8) bg-(--color-surface) border border-(--color-border-subtle) rounded-xl mb-(--space-8) text-center text-(--color-text-muted)">
                    No reviews yet — be the first to share your thoughts.
                </div>
            )}

            {/* ── Your review (read view) ── */}
            {!ownLoading && ownReview && !formOpen && (
                <div className="p-(--space-5) bg-(--color-surface) border border-(--color-border-default) rounded-xl mb-(--space-8) flex flex-col gap-(--space-3)">
                    <div className="flex items-center justify-between flex-wrap gap-(--space-3)">
                        <div className="flex items-center gap-(--space-3)">
                            <span className="text-xs text-(--color-text-muted) uppercase tracking-widest font-(--font-semibold)">
                                Your Review
                            </span>
                            <StarsDisplay value={ownReview.rating} max={10} size={14} />
                            <span
                                className={`text-xs font-(--font-semibold) uppercase tracking-wider ${STATUS_META[ownReview.status]?.className ?? "text-(--color-text-muted)"
                                    }`}
                            >
                                {STATUS_META[ownReview.status]?.label ?? ownReview.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-(--space-2)">
                            <button
                                onClick={openEditForm}
                                className="p-(--space-2) rounded-md text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-surface-hover) transition-colors duration-(--transition-fast)"
                                aria-label="Edit review"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => setConfirmingDelete(true)}
                                className="p-(--space-2) rounded-md text-(--color-text-muted) hover:text-red-400 hover:bg-(--color-surface-hover) transition-colors duration-(--transition-fast)"
                                aria-label="Delete review"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    {ownReview.review && (
                        <p className="text-sm text-(--color-text-secondary) m-0 leading-relaxed">{ownReview.review}</p>
                    )}
                    {confirmingDelete && (
                        <div className="flex items-center gap-(--space-3) p-(--space-3) bg-(--color-void-deep) rounded-lg">
                            <span className="text-sm text-(--color-text-muted)">Delete this review?</span>
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="text-sm font-(--font-semibold) text-red-400"
                            >
                                {submitting ? "Deleting…" : "Yes, delete"}
                            </button>
                            <button onClick={() => setConfirmingDelete(false)} className="text-sm text-(--color-text-muted)">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Review form (create or edit) ── */}
            {formOpen && (
                <div className="p-(--space-5) bg-(--color-surface) border border-(--color-border-subtle) rounded-xl mb-(--space-8) flex flex-col gap-(--space-4)">
                    <span className="text-sm font-(--font-semibold) text-(--color-text-primary)">
                        {editing ? "Edit your review" : "Rate this movie"}
                    </span>
                    <StarPicker value={formRating} onChange={setFormRating} />
                    <textarea
                        value={formText}
                        onChange={(e) => setFormText(e.target.value)}
                        placeholder="Share your thoughts about the movie (optional)"
                        rows={4}
                        className="w-full bg-(--color-void-deep) border border-(--color-border-default) rounded-lg p-(--space-3) text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) resize-none focus:outline-none focus:border-(--color-info)"
                    />
                    <div className="flex items-center gap-(--space-4)">
                        <button onClick={handleSubmit} disabled={submitting} className="btn link-button">
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            {editing ? "Update Review" : "Submit Review"}
                        </button>
                        <button
                            onClick={() => setFormOpen(false)}
                            className="text-sm text-(--color-text-muted) hover:text-(--color-text-primary)"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Reviews list ── */}
            {!loading && reviews.length > 0 && (
                <div className="flex flex-col gap-(--space-4)">
                    {reviews.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                    ))}
                </div>
            )}

            {!loading && page < totalPages && (
                <div className="flex justify-center mt-(--space-6)">
                    <button
                        onClick={() => loadReviews(page + 1, false)}
                        disabled={loadingMore}
                        className="bg-(--color-surface) border border-(--color-border-default) rounded-md text-(--color-text-muted) py-(--space-2) px-(--space-5) text-sm font-(--font-medium) flex items-center gap-(--space-2) hover:text-(--color-text-primary) hover:border-(--color-border-strong) transition-colors duration-(--transition-fast)"
                    >
                        {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                        Load More Reviews
                    </button>
                </div>
            )}
        </section>
    );
};

export default MovieReviews;
