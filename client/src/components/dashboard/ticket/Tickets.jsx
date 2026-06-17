"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import {
    RefreshCw,
    Ticket,
    QrCode,
    XCircle,
    Eye,
    CheckCircle2,
    CalendarDays,
    MapPin,
    Armchair,
    AlertTriangle,
    ScanLine,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { verifyTicket, cancelTicket } from "@/actions/ticket.action";
import { useAuthStore } from "@/store/authStore";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TICKET_STATUS_STYLES = {
    ACTIVE:
        "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
    USED: "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
    CANCELLED:
        "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30",
};

const BOOKING_STATUS_STYLES = {
    CONFIRMED:
        "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
    PENDING:
        "bg-(--color-yellow-dim) text-(--color-accent) border border-(--color-accent)/30",
    CANCELLED:
        "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30",
    EXPIRED:
        "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
};

const SEAT_TYPE_STYLES = {
    STANDARD: "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
    PREMIUM: "bg-(--color-purple-dim) text-(--color-info) border border-(--color-info)/30",
    VIP: "bg-(--color-yellow-dim) text-(--color-accent) border border-(--color-accent)/30",
    RECLINER: "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
};

// ─── Badge ─────────────────────────────────────────────────────────────────────

const Badge = ({ value, styleMap }) => (
    <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styleMap?.[value] ?? ""}`}
    >
        {value?.toLowerCase().replace("_", " ")}
    </span>
);

// ─── Ticket Detail Modal ───────────────────────────────────────────────────────

const TicketDetailModal = ({ ticket, onClose }) => {
    const { booking, bookingSeat } = ticket ?? {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border) sticky top-0 bg-(--color-bg-card) z-10">
                    <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-(--color-accent)" />
                        <h2 className="text-base font-semibold text-(--color-text-primary)">
                            Ticket Detail
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Ticket number + status */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-(--color-text-muted) mb-0.5">Ticket #</p>
                            <p className="text-sm font-mono font-semibold text-(--color-text-primary)">
                                {ticket?.ticketNumber ?? "—"}
                            </p>
                        </div>
                        <Badge value={ticket?.status} styleMap={TICKET_STATUS_STYLES} />
                    </div>

                    {/* Booking info */}
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                                Booking
                            </p>
                            <Badge value={booking?.status} styleMap={BOOKING_STATUS_STYLES} />
                        </div>
                        <p className="text-xs font-mono text-(--color-text-muted)">
                            #{booking?.bookingNumber ?? "—"}
                        </p>
                        <p className="text-sm font-semibold text-(--color-text-primary)">
                            {booking?.movieTitle ?? "—"}
                        </p>
                        <div className="flex flex-col gap-1 text-xs text-(--color-text-muted) mt-1">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {booking?.cinemaName ?? "—"} · {booking?.screenName ?? "—"}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-3 h-3 shrink-0" />
                                {booking?.showStartTime
                                    ? new Date(booking.showStartTime).toLocaleString(undefined, {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "—"}
                            </span>
                        </div>
                    </div>

                    {/* Seat */}
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1">
                            <Armchair className="w-3 h-3" /> Seat
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold font-mono text-(--color-text-primary)">
                                {bookingSeat?.seatLabel ?? "—"}
                            </span>
                            <Badge
                                value={bookingSeat?.seatType}
                                styleMap={SEAT_TYPE_STYLES}
                            />
                        </div>
                        {bookingSeat?.price != null && (
                            <p className="text-xs text-(--color-text-muted)">
                                Price:{" "}
                                <span className="font-semibold text-(--color-text-primary)">
                                    Rs.{bookingSeat.price}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* QR / check-in info */}
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1">
                            <QrCode className="w-3 h-3" /> Check-in
                        </p>
                        {ticket?.status === "USED" ? (
                            <div className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                                <CheckCircle2 className="w-4 h-4 text-(--color-success) shrink-0" />
                                <span>
                                    Checked in{" "}
                                    {ticket?.checkedInAt
                                        ? new Date(ticket.checkedInAt).toLocaleString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : ""}
                                </span>
                            </div>
                        ) : ticket?.status === "CANCELLED" ? (
                            <p className="text-xs text-(--color-error)">
                                Ticket has been cancelled.
                            </p>
                        ) : (
                            <p className="text-xs text-(--color-text-muted)">
                                Present QR code at the gate for entry.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Verify Ticket Modal (staff/admin) ─────────────────────────────────────────

const VerifyModal = ({ onClose }) => {
    const [token, setToken] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState(null); // { success, data, message }
    const router = useRouter();

    const handleVerify = async () => {
        const trimmed = token.trim();
        if (!trimmed) return;
        setIsVerifying(true);
        setResult(null);
        try {
            const res = await verifyTicket(trimmed);
            setResult(res);
            if (res.success) {
                router.refresh();
                toast.success("Ticket verified. Entry granted.");
            } else {
                toast.error(res.message ?? "Verification failed.");
            }
        } catch (err) {
            setResult({ success: false, message: err.message });
            toast.error(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-(--color-border) flex items-center gap-3">
                    <ScanLine className="w-5 h-5 text-(--color-info)" />
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                        Verify Ticket
                    </h2>
                    <button
                        onClick={onClose}
                        className="ml-auto text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-(--color-text-secondary)">
                        Enter or paste the ticket QR token to verify entry at the gate.
                    </p>

                    <div className="flex gap-2">
                        <input
                            className="flex-1 rounded-lg border border-(--color-border) bg-(--color-bg-surface) text-(--color-text-primary) text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-info)/40 placeholder:text-(--color-text-muted) font-mono"
                            placeholder="Paste QR token here…"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                        />
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying || !token.trim()}
                            className="btn btn-primary btn-sm px-4 disabled:opacity-50"
                        >
                            {isVerifying ? "Verifying…" : "Verify"}
                        </button>
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            className={`rounded-lg border px-4 py-3 space-y-1 ${result.success
                                ? "bg-(--color-green-dim) border-(--color-success)/30"
                                : "bg-(--color-red-dim) border-(--color-error)/30"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {result.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-(--color-success) shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-(--color-error) shrink-0" />
                                )}
                                <p
                                    className={`text-sm font-semibold ${result.success
                                        ? "text-(--color-success)"
                                        : "text-(--color-error)"
                                        }`}
                                >
                                    {result.success ? "Entry Granted" : "Entry Denied"}
                                </p>
                            </div>
                            {result.success && result.data && (
                                <div className="text-xs text-(--color-text-secondary) space-y-0.5 pl-6">
                                    <p>
                                        Seat:{" "}
                                        <span className="font-semibold text-(--color-text-primary)">
                                            {result.data.bookingSeat?.seatLabel ?? "—"}
                                        </span>
                                    </p>
                                    <p>
                                        Movie:{" "}
                                        <span className="font-semibold text-(--color-text-primary)">
                                            {result.data.booking?.movieTitle ?? "—"}
                                        </span>
                                    </p>
                                    <p>
                                        Ticket:{" "}
                                        <span className="font-mono text-(--color-text-primary)">
                                            {result.data.ticketNumber ?? "—"}
                                        </span>
                                    </p>
                                </div>
                            )}
                            {!result.success && result.message && (
                                <p className="text-xs text-(--color-error) pl-6">
                                    {result.message}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-(--color-border) flex justify-end">
                    <button
                        onClick={() => {
                            setToken("");
                            setResult(null);
                        }}
                        className="btn btn-ghost btn-sm"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Cancel Confirm Modal ──────────────────────────────────────────────────────

const CancelModal = ({ ticket, onClose, onConfirm, isLoading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-5 border-b border-(--color-border) flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-(--color-error)" />
                <h2 className="text-base font-semibold text-(--color-text-primary)">
                    Cancel Ticket
                </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-(--color-text-secondary)">
                    Are you sure you want to cancel this ticket? This action cannot be undone.
                </p>
                <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-1">
                    <p className="text-sm font-semibold text-(--color-text-primary)">
                        {ticket?.booking?.movieTitle ?? "—"}
                    </p>
                    <p className="text-xs text-(--color-text-muted) font-mono">
                        {ticket?.ticketNumber ?? "—"} · Seat{" "}
                        <span className="font-semibold text-(--color-text-primary)">
                            {ticket?.bookingSeat?.seatLabel ?? "—"}
                        </span>
                    </p>
                </div>
                <p className="text-xs text-(--color-error) flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    This ticket will no longer be valid for entry.
                </p>
            </div>
            <div className="px-6 py-4 border-t border-(--color-border) flex justify-end gap-2">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="btn btn-ghost btn-sm disabled:opacity-50"
                >
                    Keep Ticket
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="btn btn-sm bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30 hover:bg-(--color-error)/20 disabled:opacity-50"
                >
                    {isLoading ? "Cancelling…" : "Cancel Ticket"}
                </button>
            </div>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const Tickets = ({ tickets = [], pagination = {}, adminRoles }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = adminRoles?.includes(user?.role);
    const isStaff = isAdmin || user?.role === "STAFF";

    // ── Modal states ───────────────────────────────────────────
    const [activeDetailTicket, setActiveDetailTicket] = useState(null);
    const [activeCancelTicket, setActiveCancelTicket] = useState(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    // ── Loading flags ──────────────────────────────────────────
    const [isCancelling, setIsCancelling] = useState(false);

    // ── Handlers ──────────────────────────────────────────────

    const handleCancelTicket = async () => {
        if (!activeCancelTicket) return;
        setIsCancelling(true);
        try {
            const success = await cancelTicket(activeCancelTicket.id);
            if (success) {
                toast.success("Ticket cancelled successfully.");
                router.refresh();
                setActiveCancelTicket(null);
            } else {
                toast.error("Failed to cancel ticket.");
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsCancelling(false);
        }
    };

    const handlePageChange = (page) => router.push(`?page=${page}`);

    // ── Stats strip ────────────────────────────────────────────

    const stats = [
        {
            label: "Total",
            value: pagination?.total ?? tickets.length,
            color: "text-(--color-text-primary)",
        },
        {
            label: "Active",
            value: tickets.filter((t) => t.status === "ACTIVE").length,
            color: "text-(--color-success)",
        },
        {
            label: "Used",
            value: tickets.filter((t) => t.status === "USED").length,
            color: "text-(--color-text-muted)",
        },
        {
            label: "Cancelled",
            value: tickets.filter((t) => t.status === "CANCELLED").length,
            color: "text-(--color-error)",
        },
    ];

    // ── Columns ────────────────────────────────────────────────

    const sharedColumns = [
        {
            key: "ticketNumber",
            label: "Ticket #",
            sortable: true,
            render: (val) => (
                <span className="text-xs font-mono font-semibold text-(--color-text-primary) tracking-wider">
                    {val}
                </span>
            ),
        },
        {
            key: "booking",
            label: "Movie",
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-(--color-text-primary) truncate max-w-[160px]">
                        {row?.booking?.movieTitle ?? "—"}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">
                        {row?.booking?.cinemaName ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "showStartTime",
            label: "Show Time",
            sortable: false,
            render: (val, row) => {
                const time = row?.booking?.showStartTime;
                return time ? (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(time).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                ) : "—";
            },
        },
        {
            key: "bookingSeat",
            label: "Seat",
            render: (val, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-(--color-text-primary)">
                        {row?.bookingSeat?.seatLabel ?? "—"}
                    </span>
                    {row?.bookingSeat?.seatType && (
                        <Badge value={row.bookingSeat.seatType} styleMap={SEAT_TYPE_STYLES} />
                    )}
                </div>
            ),
        },
        {
            key: "seatPrice",
            label: "Price",
            render: (val, row) =>
                row?.bookingSeat?.price != null ? (
                    <span className="text-sm font-semibold tabular-nums text-(--color-text-primary)">
                        Rs.{Number(row.bookingSeat.price).toFixed(2)}
                    </span>
                ) : (
                    "—"
                ),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={TICKET_STATUS_STYLES} />,
        },
    ];

    const adminColumns = [
        ...sharedColumns,
        {
            key: "checkedInAt",
            label: "Checked In",
            render: (val) =>
                val ? (
                    <span className="text-xs text-(--color-success) flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {new Date(val).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                ) : (
                    <span className="text-xs text-(--color-text-muted)">—</span>
                ),
        },
        {
            key: "bookingNumber",
            label: "Booking #",
            render: (val, row) => (
                <span className="text-xs font-mono text-(--color-text-muted)">
                    #{row?.booking?.bookingNumber ?? "—"}
                </span>
            ),
        },
    ];

    // ── Extra actions ──────────────────────────────────────────

    const extraActions = (item) => (
        <>
            <button
                title="View Detail"
                onClick={() => setActiveDetailTicket(item)}
                className="p-1.5 rounded text-(--color-info) hover:bg-(--color-purple-dim) transition-colors"
            >
                <Eye className="w-4 h-4" />
            </button>

            {item.status === "ACTIVE" && (
                <button
                    title="Cancel Ticket"
                    onClick={() => setActiveCancelTicket(item)}
                    className="p-1.5 rounded text-(--color-error) hover:bg-(--color-red-dim) transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </>
    );

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Tickets"
                subHeading={
                    isAdmin
                        ? "View and manage all issued tickets across the platform"
                        : "Your tickets for upcoming and past shows"
                }
                button={
                    <div className="flex flex-wrap gap-2">
                        {isStaff && (
                            <button
                                onClick={() => setShowVerifyModal(true)}
                                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                            >
                                <ScanLine className="w-4 h-4" /> Verify Ticket
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

            {/* ── Stats strip ───────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(({ label, value, color }) => (
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

            <Table
                columns={isAdmin ? adminColumns : sharedColumns}
                data={tickets}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage={
                    isAdmin
                        ? "No tickets found."
                        : "You don't have any tickets yet. Book a show to get started."
                }
                searchPlaceholder={
                    isAdmin
                        ? "Search by ticket #, movie or booking…"
                        : "Search your tickets…"
                }
                extraActions={extraActions}
            />

            {/* ── Ticket Detail Modal ───────────────────────── */}
            {activeDetailTicket && (
                <TicketDetailModal
                    ticket={activeDetailTicket}
                    onClose={() => setActiveDetailTicket(null)}
                />
            )}

            {/* ── Cancel Confirm Modal ──────────────────────── */}
            {activeCancelTicket && (
                <CancelModal
                    ticket={activeCancelTicket}
                    onClose={() => setActiveCancelTicket(null)}
                    onConfirm={handleCancelTicket}
                    isLoading={isCancelling}
                />
            )}

            {/* ── Verify Modal (staff/admin) ────────────────── */}
            {showVerifyModal && (
                <VerifyModal onClose={() => setShowVerifyModal(false)} />
            )}
        </div>
    );
};

export default Tickets;
