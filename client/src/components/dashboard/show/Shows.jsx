"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw, Calendar, Clock, MapPin, Film, Ticket } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { deleteShow } from "@/actions/show.action";
import { DeleteModal } from "@/components/ui/Modals";

// ─── Status → visual style mapping ───────────────────────────────────────────
// Driven purely by what the backend sends; no enum values hardcoded here.

const getStatusStyle = (status) => {
    if (!status) return "bg-(--color-surface-hover) text-(--color-text-secondary)";

    const s = status.toUpperCase();

    if (s.includes("SCHEDULED")) return "bg-(--color-success-dim) text-(--color-success)";
    if (s.includes("CANCELLED")) return "bg-(--color-error-dim) text-(--color-error)";
    if (s.includes("COMPLETED")) return "bg-(--color-surface-hover) text-(--color-text-muted)";

    // Fallback for any future status the backend adds
    return "bg-(--color-info-dim) text-(--color-info)";
};

const formatStatusLabel = (status) =>
    status
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, " ")
        : "—";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDuration = (minutes) => {
    if (minutes == null) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Shows = ({ shows = [], pagination = {}, showStatus = [] }) => {
    const [activeDeleteShow, setActiveDeleteShow] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const columns = [
        {
            key: "movie",
            label: "Movie",
            render: (val) => (
                <div className="flex items-center gap-3 min-w-[190px]">
                    {val?.posterUrl ? (
                        <img
                            src={val.posterUrl}
                            alt={val.title}
                            className="w-9 h-[52px] object-cover rounded-md border border-(--color-surface-hover) shrink-0"
                        />
                    ) : (
                        <div className="w-9 h-[52px] rounded-md bg-(--color-surface-hover) flex items-center justify-center shrink-0">
                            <Film className="w-4 h-4 text-(--color-text-muted)" />
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-(--color-text-primary) leading-tight line-clamp-2">
                            {val?.title ?? "—"}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {val?.language && (
                                <span className="text-xs text-(--color-text-muted)">{val.language}</span>
                            )}
                            {val?.durationMinutes != null && (
                                <>
                                    {val?.language && (
                                        <span className="text-(--color-text-muted) text-xs">·</span>
                                    )}
                                    <span className="text-xs text-(--color-text-muted)">
                                        {formatDuration(val.durationMinutes)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },

        // Date & Time
        {
            key: "startTime",
            label: "Date & Time",
            sortable: true,
            render: (val, row) => (
                <div className="flex flex-col gap-1 min-w-[130px]">
                    <div className="flex items-center gap-1.5 text-sm text-(--color-text-primary)">
                        <Calendar className="w-3.5 h-3.5 text-(--color-text-muted) shrink-0" />
                        <span>{formatDate(val)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                            {formatTime(val)}
                            {row.endTime ? ` – ${formatTime(row.endTime)}` : ""}
                        </span>
                    </div>
                </div>
            ),
        },

        // Venue: cinema + screen + city
        {
            key: "screen",
            label: "Venue",
            render: (val) => (
                <div className="flex flex-col gap-0.5 min-w-[150px]">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-(--color-text-muted) shrink-0" />
                        <span className="text-sm font-medium text-(--color-text-primary)">
                            {val?.cinema?.name ?? "—"}
                        </span>
                    </div>
                    <span className="text-xs text-(--color-text-muted) pl-5">
                        {[val?.name, val?.cinema?.city].filter(Boolean).join(" · ")}
                    </span>
                </div>
            ),
        },

        // Available seats
        {
            key: "_count",
            label: "Seats",
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-(--color-text-muted)" />
                    <span className="text-sm text-(--color-text-secondary)">
                        {val?.showSeats ?? 0}
                        <span className="text-(--color-text-muted) text-xs"> avail.</span>
                    </span>
                </div>
            ),
        },

        // Status — label & style derived from the raw string the backend sends
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => (
                <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusStyle(val)}`}
                >
                    {formatStatusLabel(val)}
                </span>
            ),
        },

        // Created at
        {
            key: "createdAt",
            label: "Created",
            sortable: true,
            render: (val) => (
                <span className="text-xs text-(--color-text-muted)">{formatDate(val)}</span>
            ),
        },
    ];

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const handleOpenEdit = (item) => {
        router.push(`shows/${item.id}/edit`);
    };

    const handleDeleteShow = async (id) => {
        setIsDeleting(true);
        try {
            const data = await deleteShow(id);
            router.refresh();
            toast.success(data.message ?? "Show deleted successfully");
            setActiveDeleteShow(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page) => {
        router.push(`?page=${page}`);
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Shows"
                subHeading="Schedule and manage movie screenings"
                button={
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => router.push("shows/new")}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Schedule Show
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
                data={shows}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No shows scheduled yet."
                searchPlaceholder="Search shows by movie, venue or status..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteShow(item)}
            />

            {activeDeleteShow && (
                <DeleteModal
                    title="Show"
                    item={activeDeleteShow}
                    onClose={() => setActiveDeleteShow(null)}
                    onConfirm={() => handleDeleteShow(activeDeleteShow.id)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default Shows;
