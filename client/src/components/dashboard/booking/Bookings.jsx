"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import {
    RefreshCw,
    CheckCircle,
    XCircle,
    Eye,
    Ticket,
    Clock,
    CalendarDays,
    MapPin,
    Armchair,
    Tag,
    Receipt,
    AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { confirmBooking, cancelBooking, expireStaleBookings } from "@/actions/booking.action";
import { DeleteModal } from "@/components/ui/Modals";
import { useAuthStore } from "@/store/authStore";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
    PENDING:
        "bg-(--color-yellow-dim) text-(--color-accent) border border-(--color-accent)/30",
    CONFIRMED:
        "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
    CANCELLED:
        "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30",
    EXPIRED:
        "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
    RESERVED:
        "bg-(--color-purple-dim) text-(--color-info) border border-(--color-info)/30",
};

const SOURCE_STYLES = {
    WEB: "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
    APP: "bg-(--color-purple-dim) text-(--color-info) border border-(--color-info)/30",
    KIOSK: "bg-(--color-yellow-dim) text-(--color-accent) border border-(--color-accent)/30",
    COUNTER: "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const Badge = ({ value, styleMap }) => (
    <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${styleMap?.[value] ?? styleMap?.["PENDING"] ?? ""}`}
    >
        {value?.toLowerCase()}
    </span>
);

const CurrencyDisplay = ({ amount }) => (
    <span className="text-sm font-semibold tabular-nums text-(--color-text-primary)">
        Rs.{Number(amount ?? 0).toFixed(2)}
    </span>
);

// ─── Booking Detail Modal ──────────────────────────────────────────────────────

const BookingDetailModal = ({ booking, onClose, isAdmin }) => {
    const hasDiscount = Number(booking?.discountAmount ?? 0) > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border) sticky top-0 bg-(--color-bg-card) z-10">
                    <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-(--color-accent)" />
                        <h2 className="text-base font-semibold text-(--color-text-primary)">
                            Booking Detail
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
                    {/* Booking number + status */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-(--color-text-muted) mb-0.5">Booking #</p>
                            <p className="text-sm font-mono font-semibold text-(--color-text-primary)">
                                {booking?.bookingNumber ?? "—"}
                            </p>
                        </div>
                        <Badge value={booking?.status} styleMap={STATUS_STYLES} />
                    </div>

                    {/* Show info */}
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                            Show Info
                        </p>
                        <p className="text-sm font-semibold text-(--color-text-primary)">
                            {booking?.movieTitle ?? "—"}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-text-muted)">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {booking?.cinemaName ?? "—"} · {booking?.screenName ?? "—"}
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
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

                    {/* Seats */}
                    {booking?.seats?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1">
                                <Armchair className="w-3 h-3" /> Seats
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {booking.seats.map((s, i) => (
                                    <span
                                        key={i}
                                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-(--color-bg-surface) border border-(--color-border) text-(--color-text-primary)"
                                    >
                                        {s.seatLabel}
                                        <span className="text-(--color-text-muted) font-normal ml-1">
                                            {s.seatType?.toLowerCase()}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Customer info (admin only) */}
                    {isAdmin && booking?.user && (
                        <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-1">
                            <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                                Customer
                            </p>
                            <p className="text-sm font-medium text-(--color-text-primary)">
                                {booking.user.firstName} {booking.user.lastName}
                            </p>
                            <p className="text-xs text-(--color-text-muted)">{booking.user.email}</p>
                        </div>
                    )}

                    {/* Pricing */}
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-2">
                        <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1">
                            <Receipt className="w-3 h-3" /> Pricing
                        </p>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-(--color-text-secondary)">
                                <span>Subtotal</span>
                                <CurrencyDisplay amount={booking?.totalAmount} />
                            </div>
                            {hasDiscount && (
                                <div className="flex justify-between text-(--color-success)">
                                    <span className="flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        Discount
                                        {booking?.coupon?.code && (
                                            <span className="font-mono text-xs">
                                                ({booking.coupon.code})
                                            </span>
                                        )}
                                    </span>
                                    <span>−Rs.{Number(booking.discountAmount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-(--color-text-primary) border-t border-(--color-border) pt-1.5">
                                <span>Total Paid</span>
                                <CurrencyDisplay amount={booking?.finalAmount} />
                            </div>
                        </div>
                    </div>

                    {/* Tickets */}
                    {booking?.tickets?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                                Tickets
                            </p>
                            <div className="space-y-1.5">
                                {booking.tickets.map((t, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-md bg-(--color-bg-surface) border border-(--color-border) px-3 py-2"
                                    >
                                        <span className="text-xs font-mono text-(--color-text-primary)">
                                            {t.ticketNumber}
                                        </span>
                                        <Badge
                                            value={t.status}
                                            styleMap={{
                                                ACTIVE: "bg-(--color-green-dim) text-(--color-success) border border-(--color-success)/30",
                                                CANCELLED: "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30",
                                                USED: "bg-(--color-bg-surface) text-(--color-text-muted) border border-(--color-border)",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-text-muted) border-t border-(--color-border) pt-4">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Booked{" "}
                            {booking?.bookedAt
                                ? new Date(booking.bookedAt).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })
                                : "—"}
                        </span>
                        {booking?.source && (
                            <span>
                                Source:{" "}
                                <span className="capitalize font-medium text-(--color-text-secondary)">
                                    {booking.source.toLowerCase()}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Confirm / Cancel Action Modal ────────────────────────────────────────────

const ActionModal = ({ booking, action, onClose, onConfirm, isLoading }) => {
    const isConfirm = action === "confirm";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div className="px-6 py-5 border-b border-(--color-border) flex items-center gap-3">
                    {isConfirm ? (
                        <CheckCircle className="w-5 h-5 text-(--color-success)" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-(--color-error)" />
                    )}
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                        {isConfirm ? "Confirm Booking" : "Cancel Booking"}
                    </h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-(--color-text-secondary)">
                        {isConfirm
                            ? "This will confirm the booking and issue tickets to the customer."
                            : "This will cancel the booking and release the seats back to availability."}
                    </p>
                    <div className="rounded-lg bg-(--color-bg-surface) border border-(--color-border) px-4 py-3 space-y-1">
                        <p className="text-sm font-semibold text-(--color-text-primary)">
                            {booking?.movieTitle ?? "—"}
                        </p>
                        <p className="text-xs text-(--color-text-muted)">
                            #{booking?.bookingNumber} · {booking?.seats?.length ?? 0} seat(s) ·{" "}
                            <CurrencyDisplay amount={booking?.finalAmount} />
                        </p>
                    </div>
                    {!isConfirm && (
                        <p className="text-xs text-(--color-error) flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            This action cannot be undone.
                        </p>
                    )}
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
                        className={`btn btn-sm disabled:opacity-50 ${isConfirm
                            ? "bg-(--color-success)/10 text-(--color-success) border border-(--color-success)/30 hover:bg-(--color-success)/20"
                            : "bg-(--color-red-dim) text-(--color-error) border border-(--color-error)/30 hover:bg-(--color-error)/20"
                            }`}
                    >
                        {isLoading ? "Processing…" : isConfirm ? "Confirm" : "Cancel Booking"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const Bookings = ({ bookings = [], pagination = {}, adminRoles }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = adminRoles?.includes(user?.role.toUpperCase());

    // ── Modal states ───────────────────────────────────────────
    const [activeDetailBooking, setActiveDetailBooking] = useState(null);
    const [activeAction, setActiveAction] = useState(null); // { booking, type: 'confirm' | 'cancel' }
    const [activeDeleteBooking, setActiveDeleteBooking] = useState(null);

    // ── Loading flags ──────────────────────────────────────────
    const [isActioning, setIsActioning] = useState(false);
    const [isExpiring, setIsExpiring] = useState(false);

    // ── Handlers ──────────────────────────────────────────────

    const handleAction = async () => {
        if (!activeAction) return;
        const { booking, type } = activeAction;
        setIsActioning(true);
        try {
            if (type === "confirm") {
                await confirmBooking(booking.id);
                toast.success("Booking confirmed and tickets issued.");
            } else {
                await cancelBooking(booking.id);
                toast.success("Booking cancelled and seats released.");
            }
            router.refresh();
            setActiveAction(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsActioning(false);
        }
    };

    const handleExpireStale = async () => {
        setIsExpiring(true);
        try {
            const data = await expireStaleBookings();
            toast.success(
                data?.expired
                    ? `${data.expired} stale booking(s) expired.`
                    : "No stale bookings found."
            );
            router.refresh();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsExpiring(false);
        }
    };

    const handlePageChange = (page) => router.push(`?page=${page}`);

    // ── Stats (admin) ──────────────────────────────────────────

    const stats = [
        {
            label: "Total",
            value: pagination?.total ?? bookings.length,
            color: "text-(--color-text-primary)",
        },
        {
            label: "Confirmed",
            value: bookings.filter((b) => b.status === "CONFIRMED").length,
            color: "text-(--color-success)",
        },
        {
            label: "Pending",
            value: bookings.filter((b) => b.status === "PENDING").length,
            color: "text-(--color-accent)",
        },
        {
            label: "Cancelled",
            value: bookings.filter((b) => b.status === "CANCELLED" || b.status === "EXPIRED").length,
            color: "text-(--color-error)",
        },
    ];

    // ── Columns ────────────────────────────────────────────────

    const adminColumns = [
        {
            key: "bookingNumber",
            label: "Booking #",
            render: (val) => (
                <span className="text-xs font-mono font-semibold text-(--color-text-primary)">
                    {val}
                </span>
            ),
        },
        {
            key: "user",
            label: "Customer",
            render: (val, row) => (
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
            key: "movieTitle",
            label: "Movie",
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-(--color-text-primary) truncate max-w-[140px]">
                        {val ?? "—"}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">
                        {row.cinemaName ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "showStartTime",
            label: "Show Time",
            sortable: true,
            render: (val) =>
                val ? (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(val).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                ) : "—",
        },
        {
            key: "seats",
            label: "Seats",
            render: (val) => (
                <span className="text-sm text-(--color-text-secondary)">
                    {val?.length ?? 0}
                </span>
            ),
        },
        {
            key: "finalAmount",
            label: "Total",
            sortable: true,
            render: (val) => <CurrencyDisplay amount={val} />,
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={STATUS_STYLES} />,
        },
        {
            key: "source",
            label: "Source",
            render: (val) => <Badge value={val} styleMap={SOURCE_STYLES} />,
        },
    ];

    const customerColumns = [
        {
            key: "bookingNumber",
            label: "Booking #",
            render: (val) => (
                <span className="text-xs font-mono font-semibold text-(--color-text-primary)">
                    {val}
                </span>
            ),
        },
        {
            key: "movieTitle",
            label: "Movie",
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-(--color-text-primary)">
                        {val ?? "—"}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">
                        {row.cinemaName ?? "—"} · {row.screenName ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            key: "showStartTime",
            label: "Show Time",
            sortable: true,
            render: (val) =>
                val ? (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(val).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                ) : "—",
        },
        {
            key: "seats",
            label: "Seats",
            render: (val) => (
                <div className="flex flex-wrap gap-1">
                    {val?.slice(0, 3).map((s, i) => (
                        <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 rounded bg-(--color-bg-surface) border border-(--color-border) text-(--color-text-secondary) font-mono"
                        >
                            {s.seatLabel}
                        </span>
                    ))}
                    {val?.length > 3 && (
                        <span className="text-xs text-(--color-text-muted)">
                            +{val.length - 3} more
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "finalAmount",
            label: "Total",
            sortable: true,
            render: (val) => <CurrencyDisplay amount={val} />,
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (val) => <Badge value={val} styleMap={STATUS_STYLES} />,
        },
        {
            key: "tickets",
            label: "Tickets",
            render: (val) =>
                val?.length > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-(--color-success)">
                        <Ticket className="w-3.5 h-3.5" /> {val.length} issued
                    </span>
                ) : (
                    <span className="text-xs text-(--color-text-muted)">—</span>
                ),
        },
    ];

    // ── Admin extra actions ─────────────────────────────────────

    const adminExtraActions = (item) => (
        <>
            <button
                title="View Detail"
                onClick={() => setActiveDetailBooking(item)}
                className="p-1.5 rounded text-(--color-info) hover:bg-(--color-purple-dim) transition-colors"
            >
                <Eye className="w-4 h-4" />
            </button>

            {item.status === "PENDING" && (
                <button
                    title="Confirm Booking"
                    onClick={() => setActiveAction({ booking: item, type: "confirm" })}
                    className="p-1.5 rounded text-(--color-success) hover:bg-(--color-green-dim) transition-colors"
                >
                    <CheckCircle className="w-4 h-4" />
                </button>
            )}

            {(item.status === "PENDING" || item.status === "RESERVED") && (
                <button
                    title="Cancel Booking"
                    onClick={() => setActiveAction({ booking: item, type: "cancel" })}
                    className="p-1.5 rounded text-(--color-error) hover:bg-(--color-red-dim) transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </>
    );

    // Customer can view detail + cancel pending bookings
    const customerExtraActions = (item) => (
        <>
            <button
                title="View Detail"
                onClick={() => setActiveDetailBooking(item)}
                className="p-1.5 rounded text-(--color-info) hover:bg-(--color-purple-dim) transition-colors"
            >
                <Eye className="w-4 h-4" />
            </button>

            {item.status === "PENDING" && (
                <button
                    title="Cancel Booking"
                    onClick={() => setActiveAction({ booking: item, type: "cancel" })}
                    className="p-1.5 rounded text-(--color-error) hover:bg-(--color-red-dim) transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </>
    );

    console.log(isAdmin, adminRoles, user?.role);
    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Bookings"
                subHeading={
                    isAdmin
                        ? "Manage and monitor all bookings across the platform"
                        : "Your booking history and upcoming shows"
                }
                button={
                    <div className="flex flex-wrap gap-2">
                        {isAdmin && (
                            <button
                                onClick={handleExpireStale}
                                disabled={isExpiring}
                                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                                <Clock className="w-4 h-4" />
                                {isExpiring ? "Running…" : "Expire Stale"}
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

            {/* ── Stats strip (admin) ───────────────────────── */}
            {isAdmin && (
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
            )}

            <Table
                columns={isAdmin ? adminColumns : customerColumns}
                data={bookings}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage={
                    isAdmin
                        ? "No bookings found."
                        : "You haven't made any bookings yet."
                }
                searchPlaceholder={
                    isAdmin ? "Search by booking #, customer or movie…" : "Search your bookings…"
                }
                extraActions={isAdmin ? adminExtraActions : customerExtraActions}
            />

            {/* ── Booking Detail Modal ──────────────────────── */}
            {activeDetailBooking && (
                <BookingDetailModal
                    booking={activeDetailBooking}
                    onClose={() => setActiveDetailBooking(null)}
                    isAdmin={isAdmin}
                />
            )}

            {/* ── Confirm / Cancel Action Modal ────────────── */}
            {activeAction && (
                <ActionModal
                    booking={activeAction.booking}
                    action={activeAction.type}
                    onClose={() => setActiveAction(null)}
                    onConfirm={handleAction}
                    isLoading={isActioning}
                />
            )}
        </div>
    );
};

export default Bookings;
