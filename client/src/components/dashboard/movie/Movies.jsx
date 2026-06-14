"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { DeleteModal } from "@/components/ui/Modals";
import { deleteMovie } from "@/actions/movies.action";

const Movies = ({ movies = [], pagination = {} }) => {
    const [activeDeleteMovie, setActiveDeleteMovie] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // ─── Table columns ────────────────────────────────────────────────────────

    const columns = [
        {
            key: "posterUrl",
            label: "Poster",
            render: (val, row) =>
                val ? (
                    <img
                        src={val}
                        alt={row.title}
                        className="w-10 h-14 object-cover rounded-md border border-(--color-surface-hover)"
                    />
                ) : (
                    <div className="w-10 h-14 rounded-md bg-(--color-surface-hover) flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-(--color-text-muted)" />
                    </div>
                ),
        },
        {
            key: "title",
            label: "Title",
            sortable: true,
            render: (val) => (
                <span className="font-semibold text-(--color-text-primary)">{val}</span>
            ),
        },
        {
            key: "slug",
            label: "Slug",
            sortable: true,
            render: (val) => (
                <code className="text-xs bg-(--color-purple-dim) text-(--color-info) px-2 py-0.5 rounded font-mono tracking-wide">
                    {val}
                </code>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (val) => {
                const colors = {
                    NOW_SHOWING: "bg-(--color-success-dim) text-(--color-success)",
                    COMING_SOON: "bg-(--color-info-dim) text-(--color-info)",
                    ARCHIVED: "bg-(--color-surface-hover) text-(--color-text-muted)",
                };
                return (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[val] ?? "bg-(--color-surface-hover) text-(--color-text-secondary)"}`}>
                        {val?.replace(/_/g, " ") ?? "—"}
                    </span>
                );
            },
        },
        {
            key: "language",
            label: "Language",
            render: (val) => (
                <span className="text-sm text-(--color-text-secondary)">{val || "—"}</span>
            ),
        },
        {
            key: "durationMinutes",
            label: "Duration",
            sortable: true,
            render: (val) => (
                <span className="text-sm text-(--color-text-secondary)">
                    {val != null ? `${val} min` : "—"}
                </span>
            ),
        },
        {
            key: "releaseDate",
            label: "Release Date",
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
        }
    ];

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleOpenEdit = (item) => {
        router.push(`movies/${item.id}/edit`);
    };

    const handleDeleteMovie = async (id) => {
        setIsDeleting(true);
        try {
            const data = await deleteMovie(id);
            router.refresh();
            toast.success(data.message ?? "Movie deleted successfully");
            setActiveDeleteMovie(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page) => {
        router.push(`?page=${page}`);
    };

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Movies"
                subHeading="Manage movie categories and classifications"
                button={
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => router.push("movies/new")}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Movie
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
                data={movies}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No movies found."
                searchPlaceholder="Search movies by name, slug or description..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteMovie(item)}
            />

            {activeDeleteMovie && (
                <DeleteModal
                    title="Movie"
                    item={activeDeleteMovie}
                    onClose={() => setActiveDeleteMovie(null)}
                    onConfirm={() => handleDeleteMovie(activeDeleteMovie.id)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default Movies;