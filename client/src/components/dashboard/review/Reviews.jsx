"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import {
    Plus,
    RefreshCw,
    CheckCircle,
    XCircle,
    Star,
    ShieldCheck,
    Film,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
    moderateReview,
    deleteReviewByAdmin,
    deleteOwnReview,
    updateOwnReview,
    createReview,
} from "@/actions/review.action";
import {
    DeleteModal,
    EditModal,
    AddModal,
    FormField,
    inputClass,
} from "@/components/ui/Modals";
import { useAuthStore } from "@/store/authStore";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ["OWNER", "MANAGER", "STAFF"];

const STATUS_STYLES = {
    PENDING:
        "bg-(--color-yellow-dim) text-(--color-accent) border border-(--color-accent)/30",
    APPROVED:
        "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
    REJECTED:
        "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30",
};

// ─── Shared sub-components ─────────────────────────────────────────────────────

const Badge = ({ value, styleMap, label }) => (
    <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styleMap[String(value)] ?? ""}`}
    >
        {label ?? value?.toLowerCase()}
    </span>
);

/** 1–10 star rating rendered as filled dots + numeric label */
const RatingDisplay = ({ rating }) => {
    const filled = Math.round((rating / 10) * 5); // map 1-10 → 1-5 stars
    return (
        <div className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i < filled
                            ? "fill-(--color-accent) text-(--color-accent)"
                            : "text-(--color-border)"
                            }`}
                    />
                ))}
            </span>
            <span className="text-xs font-semibold text-(--color-text-primary)">
                {rating}
                <span className="text-(--color-text-muted) font-normal">/10</span>
            </span>
        </div>
    );
};

// ─── Moderate confirmation modal ───────────────────────────────────────────────

const ModerateModal = ({ review, action, onClose, onConfirm, isLoading }) => {
    const isApprove = action === "APPROVED";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="px-6 py-5 border-b border-(--color-border) flex items-center gap-3">
                    {isApprove ? (
                        <CheckCircle className="w-5 h-5 text-(--color-success)" />
                    ) : (
                        <XCircle className="w-5 h-5 text-(--color-error)" />
                    )}
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                        {isApprove ? "Approve Review" : "Reject Review"}
                    </h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-(--color-text-secondary)">
                        {isApprove
                            ? "This review will be made publicly visible on the movie page."
                            : "This review will be hidden from the public movie page."}
                    </p>
                    {review?.review && (
                        <blockquote className="border-l-2 border-(--color-border) pl-3 italic text-sm text-(--color-text-muted) line-clamp-3">
                            "{review.review}"
                        </blockquote>
                    )}
                    <p className="text-xs text-(--color-text-muted)">
                        By{" "}
                        <span className="font-medium text-(--color-text-primary)">
                            {review?.user?.firstName} {review?.user?.lastName}
                        </span>{" "}
                        · Rating {review?.rating}/10
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-(--color-border) flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn btn-ghost btn-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`btn btn-sm disabled:opacity-50 ${isApprove
                            ? "bg-(--color-success)/10 text-(--color-success) border border-(--color-success)/30 hover:bg-(--color-success)/20"
                            : "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30 hover:bg-(--color-error)/20"
                            }`}
                    >
                        {isLoading
                            ? "Processing…"
                            : isApprove
                                ? "Approve"
                                : "Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Review detail drawer / modal ─────────────────────────────────────────────

const ReviewDetailModal = ({ review, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border)">
                <h2 className="text-base font-semibold text-(--color-text-primary)">
                    Review Detail
                </h2>
                <button
                    onClick={onClose}
                    className="text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors text-xl leading-none"
                >
                    ×
                </button>
            </div>
            <div className="px-6 py-5 space-y-4">
                {/* Movie + user meta */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-(--color-text-primary) flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-(--color-accent)" />
                            {review?.movie?.title ?? "—"}
                        </p>
                        <p className="text-xs text-(--color-text-muted)">
                            {review?.user?.firstName} {review?.user?.lastName}
                            {review?.user?.email && (
                                <span className="ml-1">· {review.user.email}</span>
                            )}
                        </p>
                    </div>
                    <div className="shrink-0">
                        <RatingDisplay rating={review?.rating} />
                    </div>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-2">
                    <Badge value={review?.status} styleMap={STATUS_STYLES} />
                    {review?.verified && (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-(--color-purple-dim) text-(--color-info) border border-(--color-info)/30">
                            <ShieldCheck className="w-3 h-3" /> Verified Purchase
                        </span>
                    )}
                </div>

                {/* Review text */}
                {review?.review ? (
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3">
                        <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                            {review.review}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm italic text-(--color-text-muted)">
                        No written review — rating only.
                    </p>
                )}

                {/* Date */}
                <p className="text-xs text-(--color-text-muted)">
                    Submitted{" "}
                    {review?.createdAt
                        ? new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })
                        : "—"}
                </p>
            </div>
        </div>
    </div>
);

// ─── Customer: write/edit own review form fields ───────────────────────────────

const ReviewFormFields = ({ form, setForm, movies = [] }) => (
    <>
        {/* Movie selector (only shown when creating) */}
        {movies.length > 0 && (
            <FormField label="Movie">
                <select
                    className={inputClass}
                    value={form.movieId ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, movieId: e.target.value }))}
                >
                    <option value="">Select a movie…</option>
                    {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.title}
                        </option>
                    ))}
                </select>
            </FormField>
        )}

        <FormField label="Rating (1 – 10)">
            <div className="space-y-1">
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={form.rating ?? 5}
                    onChange={(e) =>
                        setForm((p) => ({ ...p, rating: Number(e.target.value) }))
                    }
                    className="w-full accent-(--color-accent)"
                />
                <div className="flex justify-between text-xs text-(--color-text-muted)">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <span
                            key={n}
                            className={
                                n === (form.rating ?? 5)
                                    ? "text-(--color-accent) font-bold"
                                    : ""
                            }
                        >
                            {n}
                        </span>
                    ))}
                </div>
            </div>
        </FormField>

        <FormField label="Review (optional)">
            <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="Share your thoughts about this movie…"
                value={form.review ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, review: e.target.value }))}
            />
        </FormField>
    </>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Reviews = ({
    reviews = [],
    pagination = {},
    movies = [],
    adminRoles = [],
}) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = adminRoles?.includes(user?.role);

    // ── Modal states ──────────────────────────────────────────
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeEditReview, setActiveEditReview] = useState(null);
    const [activeDeleteReview, setActiveDeleteReview] = useState(null);
    const [activeDetailReview, setActiveDetailReview] = useState(null);
    const [activeModerate, setActiveModerate] = useState(null);

    // ── Form states ───────────────────────────────────────────
    const [addForm, setAddForm] = useState({ movieId: "", rating: 5, review: "" });
    const [editForm, setEditForm] = useState({ rating: 5, review: "" });

    // ── Loading flags ─────────────────────────────────────────
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModerating, setIsModerating] = useState(false);

    // ── Openers ───────────────────────────────────────────────

    const handleOpenEdit = (item) => {
        setEditForm({ rating: item.rating ?? 5, review: item.review ?? "" });
        setActiveEditReview(item);
    };

    // ── Handlers ──────────────────────────────────────────────

    const handleAddReview = async () => {
        if (!addForm.movieId) return toast.error("Please select a movie.");
        setIsAdding(true);
        try {
            const ok = await createReview(addForm);
            if (!ok) throw new Error("Failed to submit review.");
            router.refresh();
            toast.success("Review submitted. It will appear after approval.");
            setAddForm({ movieId: "", rating: 5, review: "" });
            setShowAddModal(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async () => {
        const movieId = activeEditReview?.movie?.id ?? activeEditReview?.movieId;
        if (!movieId) return toast.error("Movie ID not found.");
        setIsEditing(true);
        try {
            const ok = await updateOwnReview(movieId, editForm);
            if (!ok) throw new Error("Failed to update review.");
            router.refresh();
            toast.success("Review updated. It will re-appear after approval.");
            setActiveEditReview(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteReview = async () => {
        setIsDeleting(true);
        try {
            if (isAdmin) {
                const ok = await deleteReviewByAdmin(activeDeleteReview.id);
                if (!ok) throw new Error("Failed to delete review.");
            } else {
                const movieId =
                    activeDeleteReview?.movie?.id ?? activeDeleteReview?.movieId;
                if (!movieId) throw new Error("Movie ID not found.");
                const ok = await deleteOwnReview(movieId);
                if (!ok) throw new Error("Failed to delete review.");
            }
            router.refresh();
            toast.success("Review deleted.");
            setActiveDeleteReview(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleModerate = async () => {
        if (!activeModerate) return;
        setIsModerating(true);
        try {
            const ok = await moderateReview(activeModerate.review.id, {
                status: activeModerate.action,
            });
            if (!ok) throw new Error("Failed to moderate review.");
            router.refresh();
            toast.success(
                `Review ${activeModerate.action === "APPROVED" ? "approved" : "rejected"}.`
            );
            setActiveModerate(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsModerating(false);
        }
    };

    const handlePageChange = (page) => router.push(`?page=${page}`);

    // ── Columns (admin vs customer) ───────────────────────────

    const adminColumns = [
        {
            key: "movie",
            label: "Movie",
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 shrink-0 text-(--color-accent)" />
                    <span className="text-sm font-medium text-(--color-text-primary) truncate max-w-[140px]">
                        {val?.title ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "user",
            label: "User",
            render: (val) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-(--color-text-primary)">
                        {val?.firstName} {val?.lastName}
                    </span>
                    {val?.email && (
                        <span className="text-xs text-(--color-text-muted)">{val.email}</span>
                    )}
                </div>
            ),
        },
        {
            key: "rating",
            label: "Rating",
            sortable: true,
            render: (val) => <RatingDisplay rating={val} />,
        },
        {
            key: "review",
            label: "Review",
            render: (val) =>
                val ? (
                    <span className="text-sm text-(--color-text-secondary) line-clamp-2 max-w-[200px]">
                        {val}
                    </span>
                ) : (
                    <span className="text-xs italic text-(--color-text-muted)">
                        Rating only
                    </span>
                ),
        },
        {
            key: "verified",
            label: "Verified",
            render: (val) =>
                val ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-(--color-info)">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yes
                    </span>
                ) : (
                    <span className="text-xs text-(--color-text-muted)">—</span>
                ),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={STATUS_STYLES} />,
        },
        {
            key: "createdAt",
            label: "Date",
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

    const customerColumns = [
        {
            key: "movie",
            label: "Movie",
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 shrink-0 text-(--color-accent)" />
                    <span className="text-sm font-medium text-(--color-text-primary)">
                        {val?.title ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "rating",
            label: "Rating",
            sortable: true,
            render: (val) => <RatingDisplay rating={val} />,
        },
        {
            key: "review",
            label: "Review",
            render: (val) =>
                val ? (
                    <span className="text-sm text-(--color-text-secondary) line-clamp-2 max-w-[260px]">
                        {val}
                    </span>
                ) : (
                    <span className="text-xs italic text-(--color-text-muted)">
                        Rating only
                    </span>
                ),
        },
        {
            key: "verified",
            label: "Verified",
            render: (val) =>
                val ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-(--color-info)">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                ) : (
                    <span className="text-xs text-(--color-text-muted)">Unverified</span>
                ),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={STATUS_STYLES} />,
        },
        {
            key: "createdAt",
            label: "Date",
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

    // ── Admin extra actions: approve / reject + view detail ───

    const adminExtraActions = (item) => (
        <>
            {/* View detail */}
            <button
                title="View Detail"
                onClick={() => setActiveDetailReview(item)}
                className="p-1.5 rounded text-(--color-info) hover:bg-(--color-purple-dim) transition-colors"
            >
                <Star className="w-4 h-4" />
            </button>

            {/* Approve */}
            {item.status !== "APPROVED" && (
                <button
                    title="Approve"
                    onClick={() =>
                        setActiveModerate({ review: item, action: "APPROVED" })
                    }
                    className="p-1.5 rounded text-(--color-success) hover:bg-(--color-green-dim) transition-colors"
                >
                    <CheckCircle className="w-4 h-4" />
                </button>
            )}

            {/* Reject */}
            {item.status !== "REJECTED" && (
                <button
                    title="Reject"
                    onClick={() =>
                        setActiveModerate({ review: item, action: "REJECTED" })
                    }
                    className="p-1.5 rounded text-(--color-error) hover:bg-(--color-red-dim) transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </>
    );

    // ── Render ────────────────────────────────────────────────

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Reviews"
                subHeading={
                    isAdmin
                        ? "Moderate and manage all movie reviews across the platform"
                        : "Your submitted movie reviews"
                }
                button={
                    <div className="flex flex-wrap gap-2">
                        {/* Customers can write new reviews */}
                        {!isAdmin && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                            >
                                <Plus className="w-4 h-4" /> Write Review
                            </button>
                        )}
                        <button
                            onClick={() => router.refresh()}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                }
            />

            {/* ── Stats strip (admin only) ──────────────────── */}
            {isAdmin && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        {
                            label: "Total",
                            value: pagination?.total ?? reviews.length,
                            color: "text-(--color-text-primary)",
                        },
                        {
                            label: "Pending",
                            value: reviews.filter((r) => r.status === "PENDING").length,
                            color: "text-(--color-accent)",
                        },
                        {
                            label: "Approved",
                            value: reviews.filter((r) => r.status === "APPROVED").length,
                            color: "text-(--color-success)",
                        },
                        {
                            label: "Rejected",
                            value: reviews.filter((r) => r.status === "REJECTED").length,
                            color: "text-(--color-error)",
                        },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className="rounded-xl bg-(--color-bg-card) border border-(--color-border) px-4 py-3 flex flex-col gap-0.5"
                        >
                            <span className="text-xs text-(--color-text-muted)">{label}</span>
                            <span className={`text-xl font-bold tabular-nums ${color}`}>
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <Table
                columns={isAdmin ? adminColumns : customerColumns}
                data={reviews}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage={
                    isAdmin
                        ? "No reviews found."
                        : "You haven't reviewed any movies yet."
                }
                searchPlaceholder={
                    isAdmin
                        ? "Search by movie or user…"
                        : "Search your reviews…"
                }
                onEdit={!isAdmin ? handleOpenEdit : undefined}
                onDelete={(item) => setActiveDeleteReview(item)}
                extraActions={isAdmin ? adminExtraActions : undefined}
            />

            {/* ── Add Review Modal (customer only) ─────────── */}
            {showAddModal && (
                <AddModal
                    title="Write a Review"
                    onClose={() => {
                        setShowAddModal(false);
                        setAddForm({ movieId: "", rating: 5, review: "" });
                    }}
                    onSave={handleAddReview}
                    isAdding={isAdding}
                    saveLabel="Submit Review"
                >
                    <ReviewFormFields
                        form={addForm}
                        setForm={setAddForm}
                        movies={movies}
                    />
                </AddModal>
            )}

            {/* ── Edit Review Modal (customer only) ────────── */}
            {activeEditReview && (
                <EditModal
                    title="Edit Your Review"
                    onClose={() => setActiveEditReview(null)}
                    onSave={handleSaveEdit}
                    isEditing={isEditing}
                    saveLabel="Save Changes"
                >
                    <p className="text-sm text-(--color-text-secondary) mb-2">
                        Editing your review for{" "}
                        <span className="font-semibold text-(--color-text-primary)">
                            {activeEditReview?.movie?.title ?? "this movie"}
                        </span>
                        . It will go back to pending moderation.
                    </p>
                    <ReviewFormFields form={editForm} setForm={setEditForm} />
                </EditModal>
            )}

            {/* ── Delete Modal ──────────────────────────────── */}
            {activeDeleteReview && (
                <DeleteModal
                    title="Review"
                    item={activeDeleteReview}
                    onClose={() => setActiveDeleteReview(null)}
                    onConfirm={handleDeleteReview}
                    isDeleting={isDeleting}
                />
            )}

            {/* ── Moderate Modal (admin only) ───────────────── */}
            {activeModerate && (
                <ModerateModal
                    review={activeModerate.review}
                    action={activeModerate.action}
                    onClose={() => setActiveModerate(null)}
                    onConfirm={handleModerate}
                    isLoading={isModerating}
                />
            )}

            {/* ── Detail Modal (admin only) ─────────────────── */}
            {activeDetailReview && (
                <ReviewDetailModal
                    review={activeDetailReview}
                    onClose={() => setActiveDetailReview(null)}
                />
            )}
        </div>
    );
};

export default Reviews;
