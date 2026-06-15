"use client";

import React, { useState, useMemo } from "react";
import {
    Search,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Pencil,
    Trash2,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from "lucide-react";

const Table = ({
    columns = [],
    data = [],
    isLoading = false,
    emptyMessage = "No records found.",

    // Actions callbacks
    onEdit,
    onDelete,
    onView,
    extraActions,

    // Modal Components (Optional inline modal management)
    EditModal,
    DeleteModal,
    onRefresh,

    // Server-Side Search/Sort Callbacks (If provided, bypass client-side logic)
    onSearch,
    onSort,

    // Server-Side Pagination — pass the full pagination object from your backend:
    // { page, totalPages, total, limit }
    // Also pass onPageChange(pageNumber) to handle page requests
    pagination,
    onPageChange,

    // Configs
    searchPlaceholder = "Search records...",
    showSearch = true,
}) => {
    // Client-side states
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [clientPage, setClientPage] = useState(1);
    const clientLimit = 10;

    // Internal Modal States
    const [activeEditItem, setActiveEditItem] = useState(null);
    const [activeDeleteItem, setActiveDeleteItem] = useState(null);

    // Determine if we're in server-side pagination mode
    const isServerPaginated = !!pagination;

    // Handle Search Input Change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setClientPage(1);
        if (onSearch) onSearch(query);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setClientPage(1);
        if (onSearch) onSearch("");
    };

    // Handle Sort click
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        } else if (sortConfig.key === key && sortConfig.direction === "desc") {
            setSortConfig({ key: null, direction: "asc" });
            if (onSort) onSort(null, null);
            return;
        }

        const newConfig = { key, direction };
        setSortConfig(newConfig);
        if (onSort) onSort(key, direction);
    };

    // Client-Side Filter, Sort & Paginate
    const processedData = useMemo(() => {
        let result = [...data];

        if (!onSearch && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((item) =>
                columns.some((col) => {
                    const value = item[col.key];
                    if (value === undefined || value === null) return false;
                    return String(value).toLowerCase().includes(query);
                })
            );
        }

        if (!onSort && sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (aVal === undefined || aVal === null) return 1;
                if (bVal === undefined || bVal === null) return -1;

                if (typeof aVal === "string") aVal = aVal.toLowerCase();
                if (typeof bVal === "string") bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, columns, searchQuery, sortConfig, onSearch, onSort]);

    // Server-side pagination: data is already the current page's slice.
    // Client-side pagination: slice processedData ourselves.
    const paginatedData = useMemo(() => {
        if (isServerPaginated) return processedData;
        const startIndex = (clientPage - 1) * clientLimit;
        return processedData.slice(startIndex, startIndex + clientLimit);
    }, [processedData, clientPage, isServerPaginated]);

    const computedTotalPages = isServerPaginated
        ? (pagination.totalPages ?? 1)
        : Math.ceil(processedData.length / clientLimit);

    const activePage = isServerPaginated ? (pagination.page ?? 1) : clientPage;

    const handlePageChange = (page) => {
        if (page < 1 || page > computedTotalPages) return;
        if (isServerPaginated) {
            if (onPageChange) onPageChange(page);
        } else {
            setClientPage(page);
        }
    };

    // Action Triggers
    const triggerEdit = (item) => {
        if (EditModal) setActiveEditItem(item);
        else if (onEdit) onEdit(item);
    };

    const triggerDelete = (item) => {
        if (DeleteModal) setActiveDeleteItem(item);
        else if (onDelete) onDelete(item);
    };

    const triggerView = (item) => {
        if (onView) onView(item);
    };

    // Render Sort Icon
    const renderSortIcon = (column) => {
        if (!column.sortable) return null;
        if (sortConfig.key !== column.key)
            return <ChevronsUpDown className="w-3.5 h-3.5 ml-1.5 text-gray-500 opacity-60" />;
        return sortConfig.direction === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 ml-1.5 text-(--color-accent)" />
        ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-(--color-accent)" />
        );
    };

    // Pagination button range — shows first, last, current ± 1, with ellipsis
    const pageButtons = useMemo(() => {
        const buttons = [];
        for (let i = 1; i <= computedTotalPages; i++) {
            const isEdge = i === 1 || i === computedTotalPages;
            const isNearActive = Math.abs(i - activePage) <= 1;
            const isEllipsisSlot = i === 2 || i === computedTotalPages - 1;

            if (isEdge || isNearActive) {
                buttons.push({ type: "page", number: i });
            } else if (isEllipsisSlot) {
                // Only push ellipsis once per gap
                if (buttons[buttons.length - 1]?.type !== "ellipsis") {
                    buttons.push({ type: "ellipsis", key: `ellipsis-${i}` });
                }
            }
        }
        return buttons;
    }, [computedTotalPages, activePage]);

    const showActions = !!onEdit || !!onDelete || !!onView || !!EditModal || !!DeleteModal;

    // Shared meta footer text
    const metaText = isServerPaginated && pagination.total !== undefined
        ? `Page ${activePage} of ${computedTotalPages} — ${pagination.total} total records`
        : `Page ${activePage} of ${computedTotalPages}`;

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Search Controls */}
            {showSearch && (
                <div className="relative flex items-center max-w-md w-full">
                    <Search className="absolute left-3.5 w-4 h-4 text-(--color-text-muted)" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-(--color-bg-surface) border border-(--color-border-default) text-(--color-text-primary) placeholder-(--color-text-muted) focus:outline-none focus:border-(--color-border-accent) transition-all duration-200 text-sm shadow-inner"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 p-1 rounded-full text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-surface-hover) transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Table Main Wrapper */}
            <div className="bg-(--color-bg-surface) border border-(--color-border-default) rounded-xl overflow-hidden shadow-lg">

                {/* 1. Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-(--color-surface-raised) border-b border-(--color-border-default) text-xs font-semibold tracking-wider text-(--color-text-primary) uppercase select-none">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                        className={`px-6 py-4 font-medium transition-colors ${col.sortable ? "cursor-pointer hover:bg-(--color-surface-hover)" : ""
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            {col.label}
                                            {renderSortIcon(col)}
                                        </div>
                                    </th>
                                ))}
                                {showActions && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-(--color-border-subtle)">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <tr key={rowIndex} className="animate-pulse">
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-6 py-4.5">
                                                <div className="h-4 bg-(--color-surface-raised) rounded w-3/4"></div>
                                            </td>
                                        ))}
                                        {showActions && (
                                            <td className="px-6 py-4.5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <div className="w-8 h-8 bg-(--color-surface-raised) rounded"></div>
                                                    <div className="w-8 h-8 bg-(--color-surface-raised) rounded"></div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <AlertCircle className="w-10 h-10 text-(--color-text-muted)" />
                                            <p className="text-(--color-text-secondary) font-medium">{emptyMessage}</p>
                                            <p className="text-xs text-(--color-text-muted)">Try adjusting your search query or check back later.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, rowIndex) => (
                                    <tr
                                        key={item.id || item._id || rowIndex}
                                        className="hover:bg-(--color-surface-hover) transition-colors duration-150 text-sm text-(--color-text-secondary)"
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-6 py-4.5 align-middle whitespace-normal break-all max-w-xs">
                                                {col.render ? col.render(item[col.key], item) : item[col.key] ?? "-"}
                                            </td>
                                        ))}

                                        {showActions && (
                                            <td className="px-6 py-4.5 align-middle text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {onView && (
                                                        <button onClick={() => triggerView(item)} className="p-1.5 rounded text-(--color-info) hover:text-(--color-info-hover) hover:bg-(--color-info-dim) transition-all duration-150" title="View">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(onEdit || EditModal) && (
                                                        <button onClick={() => triggerEdit(item)} className="p-1.5 rounded text-(--color-accent) hover:text-(--color-accent-hover) hover:bg-(--color-accent-dim) transition-all duration-150" title="Edit">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(onDelete || DeleteModal) && (
                                                        <button onClick={() => triggerDelete(item)} className="p-1.5 rounded text-(--color-danger) hover:text-(--color-danger-hover) hover:bg-(--color-bg-danger) transition-all duration-150" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {extraActions && (
                                                        <>{extraActions(item)}</>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. Mobile View */}
                <div className="block md:hidden">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="p-4 rounded-xl border border-(--color-border-subtle) bg-(--color-surface-raised) space-y-3 animate-pulse">
                                    <div className="h-5 bg-(--color-surface) rounded w-1/3"></div>
                                    <div className="h-4 bg-(--color-surface) rounded w-2/3"></div>
                                    <div className="h-4 bg-(--color-surface) rounded w-1/2"></div>
                                    <div className="pt-2 flex justify-end gap-2 border-t border-(--color-border-subtle)">
                                        <div className="w-8 h-8 bg-(--color-surface) rounded"></div>
                                        <div className="w-8 h-8 bg-(--color-surface) rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : paginatedData.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                            <AlertCircle className="w-9 h-9 text-(--color-text-muted)" />
                            <p className="text-(--color-text-secondary) font-medium text-sm">{emptyMessage}</p>
                            <p className="text-xs text-(--color-text-muted)">Try adjusting your search query.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-(--color-border-subtle)">
                            {paginatedData.map((item, rowIndex) => (
                                <div key={item.id || item._id || rowIndex} className="p-5 flex flex-col gap-3.5 hover:bg-(--color-surface-hover) transition-colors">
                                    {columns.map((col) => (
                                        <div key={col.key} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                            <span className="text-[11px] font-semibold tracking-wider text-(--color-text-muted) uppercase">{col.label}</span>
                                            <div className="text-sm text-(--color-text-primary) break-all">
                                                {col.render ? col.render(item[col.key], item) : item[col.key] ?? "-"}
                                            </div>
                                        </div>
                                    ))}
                                    {showActions && (
                                        <div className="pt-3.5 border-t border-(--color-border-subtle) flex items-center justify-end gap-3">
                                            {onView && (
                                                <button onClick={() => triggerView(item)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-(--color-info-dim) text-(--color-info) hover:text-(--color-info-hover) transition-all">
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                            )}
                                            {(onEdit || EditModal) && (
                                                <button onClick={() => triggerEdit(item)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-(--color-accent-dim) text-(--color-accent) hover:text-(--color-accent-hover) transition-all">
                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                </button>
                                            )}
                                            {(onDelete || DeleteModal) && (
                                                <button onClick={() => triggerDelete(item)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-(--color-bg-danger) text-(--color-danger) hover:text-(--color-danger-hover) transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {computedTotalPages >= 1 && (
                <div className="flex items-center justify-between mt-2 px-1">
                    <p className="text-xs text-(--color-text-muted)">{metaText}</p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(activePage - 1)}
                            disabled={activePage === 1}
                            className="p-1.5 rounded border border-(--color-border-default) bg-(--color-bg-surface) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-surface-hover) disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-(--color-text-secondary) transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {pageButtons.map((btn) =>
                            btn.type === "ellipsis" ? (
                                <span key={btn.key} className="text-xs text-(--color-text-muted) px-1">...</span>
                            ) : (
                                <button
                                    key={btn.number}
                                    onClick={() => handlePageChange(btn.number)}
                                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${activePage === btn.number
                                        ? "bg-(--color-accent) text-(--color-accent-text) shadow-sm"
                                        : "border border-(--color-border-default) bg-(--color-bg-surface) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-surface-hover)"
                                        }`}
                                >
                                    {btn.number}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => handlePageChange(activePage + 1)}
                            disabled={activePage === computedTotalPages}
                            className="p-1.5 rounded border border-(--color-border-default) bg-(--color-bg-surface) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-surface-hover) disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-(--color-text-secondary) transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Inline Modals */}
            {activeEditItem && EditModal && (
                <EditModal item={activeEditItem} onClose={() => setActiveEditItem(null)} onSuccess={() => { setActiveEditItem(null); if (onRefresh) onRefresh(); }} />
            )}
            {activeDeleteItem && DeleteModal && (
                <DeleteModal item={activeDeleteItem} onClose={() => setActiveDeleteItem(null)} onSuccess={() => { setActiveDeleteItem(null); if (onRefresh) onRefresh(); }} />
            )}
        </div>
    );
};

export default Table;