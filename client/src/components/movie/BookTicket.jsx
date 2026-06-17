"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import {
    Calendar,
    MapPin,
    Ticket,
    X,
    Info,
    Monitor,
    Loader2,
} from "lucide-react";

import { createBooking } from "@/actions/booking.action";
import { useAuthStore } from "@/store/authStore";
import { AuthModalManager } from "../ui/AuthModal";
import { toast } from "react-toastify";
import { createPaymentIntent } from "@/actions/payment.action";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */

function formatTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function groupByDate(shows) {
    const map = {};
    shows.forEach((s) => {
        const d = new Date(s.startTime).toDateString();
        if (!map[d]) map[d] = [];
        map[d].push(s);
    });
    return map;
}

function groupSeatsByRow(seats) {
    const map = {};
    seats.forEach((s) => {
        if (!map[s.rowLabel]) map[s.rowLabel] = [];
        map[s.rowLabel].push(s);
    });
    // sort seats within each row
    Object.values(map).forEach((row) =>
        row.sort((a, b) => a.seatNumber - b.seatNumber)
    );
    return map;
}

// const FALLBACK_PRICES = {
//     REGULAR: 500,
//     PREMIUM: 800,
//     VIP: 1200,
//     RECLINER: 1000,
//     COUPLE: 900,
// };

/* ─────────────────────────────────────────────────────────────
   SEAT COMPONENT
───────────────────────────────────────────────────────────── */

function Seat({ seat, showSeat, isSelected, onToggle }) {
    const status = showSeat?.status ?? "AVAILABLE";

    const isBooked = status === "BLOCKED" || status === "MAINTENANCE";
    const isRegular = seat.seatType === "REGULAR";
    const isPremium = seat.seatType === "PREMIUM";
    const isVip = seat.seatType === "VIP" || seat.seatType === "PREMIUM";
    const isRecliner = seat.seatType === "RECLINER";
    const isCouple = seat.seatType === "COUPLE";
    const isDisabled = status === "BLOCKED" || status === "MAINTENANCE";

    const baseClasses =
        "relative w-7 h-6 rounded-t-lg border transition-all duration-150 flex items-center justify-center text-[9px] font-semibold cursor-pointer select-none shrink-0";

    let stateClasses = "";
    if (isBooked) {
        stateClasses =
            "bg-(--color-void-lifted) border-(--color-border-subtle) cursor-not-allowed opacity-40";
    } else if (isSelected) {
        stateClasses =
            "bg-(--color-accent) border-(--color-accent) text-(--color-accent-text) shadow-[0_0_10px_rgba(254,229,5,0.5)]";
    } else if (isRegular) {
        stateClasses = "bg-(--color-purple-dim) border-(--color-purple) text-(--color-text-muted) hover:bg-(--color-purple) hover:border-(--color-purple-bright) hover:text-(--color-text-primary)";
    } else if (isPremium) {
        stateClasses =
            "bg-(--color-info-dim) border-(--color-info) text-(--color-info) hover:bg-(--color-info) hover:text-(--color-info-text)";
    } else if (isVip) {
        stateClasses = "bg-(--color-info-dim) border-(--color-info) text-(--color-info) hover:bg-(--color-info) hover:text-(--color-info-text)";
    } else if (isRecliner) {
        stateClasses = "bg-amber-900/40 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white";
    } else if (isCouple) {
        stateClasses = "bg-pink-900/40 border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white w-14";
    } else if (isDisabled) {
        stateClasses =
            "bg-(--color-surface) border-(--color-border-subtle) cursor-not-allowed opacity-30";
    } else {
        stateClasses =
            "bg-(--color-purple-dim) border-(--color-purple) text-(--color-text-muted) hover:bg-(--color-purple) hover:border-(--color-purple-bright) hover:text-(--color-text-primary)";
    }

    return (
        <button
            className={`${baseClasses} ${stateClasses}`}
            onClick={() => !isBooked && !isDisabled && onToggle(seat, showSeat)}
            title={`${seat.rowLabel}${seat.seatNumber} — ${seat.seatType}`}
            disabled={isBooked || isDisabled}
            aria-label={`Seat ${seat.rowLabel}${seat.seatNumber}`}
        />
    );
}

const BookingPage = ({ movie, shows = [], initialShowId = null }) => {
    /* ── State ── */
    const { isAuthenticated } = useAuthStore();
    const [selectedShowId, setSelectedShowId] = useState(initialShowId);
    const [seats, setSeats] = useState([]);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [selectedSeatIds, setSelectedSeatIds] = useState(new Set());
    const [activeDateKey, setActiveDateKey] = useState(null);
    const [couponCode, setCouponCode] = useState("");
    const [isBooking, setIsBooking] = useState(false);

    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalType, setAuthModalType] = useState("prompt")
    const router = useRouter();

    /* ── Derived ── */
    const showsByDate = useMemo(() => groupByDate(shows), [shows]);
    const dateKeys = Object.keys(showsByDate);
    const currentDateKey = activeDateKey ?? dateKeys[0] ?? null;
    const showsForDate = currentDateKey ? showsByDate[currentDateKey] ?? [] : [];
    const selectedShow = shows.find((s) => s.id === selectedShowId) ?? null;

    const showSeatMap = useMemo(() => {
        if (!selectedShow?.showSeats) return {};
        const m = {};
        selectedShow.showSeats.forEach((ss) => {
            m[ss.seat?.id ?? ss.seatId] = ss;
        });
        return m;
    }, [selectedShow]);

    const seatsByRow = useMemo(() => groupSeatsByRow(seats), [seats]);
    const rowLabels = Object.keys(seatsByRow).sort();

    const selectedSeats = seats.filter((s) => selectedSeatIds.has(s.id));
    const totalPrice = useMemo(() => {
        return selectedSeats.reduce((acc, seat) => {
            return acc + getSeatPrice(seat);
        }, 0);
    }, [selectedSeats, selectedShow]);

    /* ── Actions ── */
    async function handleSelectShow(show) {
        setSelectedShowId(show.id);
        setSelectedSeatIds(new Set());
        setSeats([]);
        setLoadingSeats(true);
        try {
            const res = await fetch(
                `${process.env.API_BASE_URL}/seats/${show.screen?.screenId ?? show.screenId}/seats?limit=200`
            );
            const json = await res.json();
            setSeats(json.data?.seats ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSeats(false);
        }
    }

    function toggleSeat(seat) {
        setSelectedSeatIds((prev) => {
            const next = new Set(prev);
            next.has(seat.id) ? next.delete(seat.id) : next.add(seat.id);
            return next;
        });
    }

    function getSeatPrice(seat) {
        const rules = seat.showSeats?.[0]?.show?.pricingRules ?? [];
        const rule = rules.find((r) => r.seatType === seat.seatType);
        if (rule) return parseFloat(rule.amount);
        return selectedShow?.basePrice ?? 0;
    }

    /* ── Build checkout payload ── */
    const checkoutPayload = selectedShow
        ? {
            showId: selectedShow.id,
            seatIds: [...selectedSeatIds],
            couponCode: couponCode ? couponCode : null,
        }
        : null;

    const handleSubmit = async () => {
        setIsBooking(true)
        try {
            const response = await createBooking(checkoutPayload)
            const paymentIntent = await createPaymentIntent({ bookingId: response.id })
            setIsBooking(false)
            router.push(`/checkout?clientSecret=${paymentIntent.clientSecret}`)
        } catch (err) {
            console.log(err)
            toast.error(err.message)
            setIsBooking(false)
        }
    }

    /* ── Auth modals ── */
    const openAuthModal = (type) => {
        setAuthModalType(type)
        setShowAuthModal(true)
    }

    const closeAuthModal = () => {
        setShowAuthModal(false)
    }

    return (
        <main className="min-h-screen mt-28 bg-(--color-bg-page) text-(--color-text-secondary) font-(family-name:--font-body)">

            {/* ══ AMBIENT HERO BACKGROUND ══ */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {movie?.bannerUrl && (
                    <Image
                        src={movie.bannerUrl}
                        alt=""
                        fill
                        className="object-cover object-center opacity-[0.07] blur-2xl scale-110"
                        priority
                    />
                )}
                {/* deep vignette */}
                <div className="absolute inset-0 bg-linear-to-b from-(--color-void)/80 via-(--color-void)/60 to-(--color-void)" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">

                {/* ══ PAGE HEADER ══ */}
                <div className="flex items-start gap-5 mb-10">
                    {movie?.posterUrl && (
                        <div className="shrink-0 w-16 h-24 rounded-lg overflow-hidden border border-(--color-border-default) shadow-(--shadow-md) hidden sm:block">
                            <Image
                                src={movie.posterUrl}
                                alt={movie.title}
                                width={64}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <p className="eyebrow mb-1">Now Booking</p>
                        <h1 className="font-(family-name:--font-display) text-3xl md:text-4xl font-extrabold text-(--color-text-primary) tracking-tight leading-tight m-0">
                            {movie?.title ?? "Select Your Show"}
                        </h1>
                        {movie?.genres && (
                            <p className="text-sm text-(--color-text-muted) mt-1 m-0">
                                {movie.genres.map((g) => g.genre?.name ?? g.name).join(" · ")}
                                {movie.durationMinutes && ` · ${Math.floor(movie.durationMinutes / 60)}h ${movie.durationMinutes % 60}m`}
                                {movie.language && ` · ${movie.language}`}
                            </p>
                        )}
                    </div>
                </div>

                {/* ══ MAIN LAYOUT: Left panel + Seat Map + Right summary ══ */}
                <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_320px] gap-6 items-start">

                    {/* ────────────────────────────────────────
                        LEFT PANEL — Date & Showtime picker
                    ──────────────────────────────────────── */}
                    <aside className="flex flex-col gap-4">

                        {/* Date strip */}
                        <div className="card p-4 rounded-xl border border-(--color-border-default) bg-(--color-surface)">
                            <p className="eyebrow mb-3">Select Date</p>
                            <div className="flex xl:flex-col gap-2 overflow-x-auto pb-1 xl:pb-0 xl:overflow-visible">
                                {dateKeys.map((dk) => {
                                    const d = new Date(dk);
                                    const isActive = dk === currentDateKey;
                                    return (
                                        <button
                                            key={dk}
                                            onClick={() => {
                                                setActiveDateKey(dk);
                                                setSelectedShowId(null);
                                                setSeats([]);
                                                setSelectedSeatIds(new Set());
                                            }}
                                            className={`flex xl:flex-row flex-col xl:items-center items-center justify-center xl:justify-start gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all shrink-0 cursor-pointer
                                                ${isActive
                                                    ? "bg-(--color-accent) border-(--color-accent) text-(--color-accent-text)"
                                                    : "bg-(--color-void-lifted) border-(--color-border-default) text-(--color-text-muted) hover:border-(--color-border-strong) hover:text-(--color-text-primary)"
                                                }`}
                                        >
                                            <span className={`text-xl font-extrabold font-(family-name:--font-display) leading-none ${isActive ? "text-(--color-accent-text)" : "text-(--color-text-primary)"}`}>
                                                {d.getDate()}
                                            </span>
                                            <span className={`text-xs uppercase tracking-widest ${isActive ? "text-(--color-accent-text)/70" : "text-(--color-text-muted)"}`}>
                                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                                            </span>
                                        </button>
                                    );
                                })}
                                {dateKeys.length === 0 && (
                                    <p className="text-sm text-(--color-text-muted) py-2">No shows available</p>
                                )}
                            </div>
                        </div>

                        {/* Showtime list */}
                        <div className="card p-4 rounded-xl border border-(--color-border-default) bg-(--color-surface)">
                            <p className="eyebrow mb-3">Showtime</p>
                            <div className="flex flex-col gap-2">
                                {showsForDate.map((show) => {
                                    const isActive = show.id === selectedShowId;
                                    const availableCount = show._count?.showSeats ?? null;
                                    return (
                                        <button
                                            key={show.id}
                                            onClick={() => handleSelectShow(show)}
                                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all cursor-pointer
                                                ${isActive
                                                    ? "bg-(--color-accent-dim) border-(--color-accent) "
                                                    : "bg-(--color-void-lifted) border-(--color-border-default) hover:border-(--color-border-strong)"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`font-(family-name:--font-display) text-base font-bold ${isActive ? "text-(--color-accent)" : "text-(--color-text-primary)"}`}>
                                                    {formatTime(show.startTime)}
                                                </span>
                                                {availableCount !== null && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${availableCount < 20 ? "badge badge-danger" : "badge badge-success"}`}>
                                                        {availableCount} left
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-(--color-text-muted)">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={10} />
                                                    {show.screen?.cinema?.name ?? "—"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Monitor size={10} />
                                                    {show.screen?.name ?? "—"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {showsForDate.length === 0 && (
                                    <p className="text-sm text-(--color-text-muted) py-1">Pick a date above to see showtimes.</p>
                                )}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="card p-4 rounded-xl border border-(--color-border-default) bg-(--color-surface)">
                            <p className="eyebrow mb-3">Legend</p>
                            <div className="flex flex-col gap-2 text-xs text-(--color-text-muted)">
                                {[
                                    { color: "bg-(--color-purple-dim) border-(--color-purple)", label: "Available" },
                                    { color: "bg-(--color-accent) border-(--color-accent)", label: "Selected" },
                                    { color: "bg-(--color-info-dim) border-(--color-info)", label: "VIP / Premium" },
                                    { color: "bg-(--color-void-lifted) border-(--color-border-subtle) opacity-40", label: "Sold / Reserved" },
                                    { color: "bg-(--color-purple-dim) border-(--color-purple)", label: "Regular" },
                                    { color: "bg-amber-900/40 border-amber-500", label: "Recliner" },
                                    { color: "bg-pink-900/40 border-pink-500", label: "Couple" },
                                    { color: "bg-(--color-void-lifted) border-(--color-border-subtle) opacity-40", label: "Blocked / Maintenance" },
                                ].map(({ color, label }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className={`w-6 h-5 rounded-t-md border ${color} shrink-0`} />
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ────────────────────────────────────────
                        CENTRE — Seat Map
                    ──────────────────────────────────────── */}
                    <section className="card rounded-2xl border border-(--color-border-default) bg-(--color-surface) overflow-hidden">

                        {/* Screen indicator */}
                        <div className="flex flex-col items-center py-6 px-8 border-b border-(--color-border-subtle)">
                            <div className="relative w-full max-w-sm">
                                {/* Screen arc */}
                                <svg
                                    viewBox="0 0 320 40"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-full"
                                >
                                    <path
                                        d="M10 35 Q160 5 310 35"
                                        stroke="url(#screenGrad)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    {/* Glow line */}
                                    <path
                                        d="M10 35 Q160 5 310 35"
                                        stroke="url(#screenGlow)"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        opacity="0.25"
                                    />
                                    <defs>
                                        <linearGradient id="screenGrad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#4D4767" stopOpacity="0" />
                                            <stop offset="0.3" stopColor="#FEE505" />
                                            <stop offset="0.7" stopColor="#FEE505" />
                                            <stop offset="1" stopColor="#4D4767" stopOpacity="0" />
                                        </linearGradient>
                                        <linearGradient id="screenGlow" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#FEE505" stopOpacity="0" />
                                            <stop offset="0.5" stopColor="#FEE505" />
                                            <stop offset="1" stopColor="#FEE505" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <p className="text-center text-xs text-(--color-text-muted) tracking-widest uppercase font-semibold mt-1">
                                    Screen
                                </p>
                            </div>
                        </div>

                        {/* Seat grid */}
                        <div className="p-6 md:p-8 overflow-x-auto">
                            {!selectedShowId && (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-(--color-text-muted)">
                                    <div className="w-16 h-16 rounded-full bg-(--color-surface-raised) border border-(--color-border-subtle) flex items-center justify-center">
                                        <Ticket size={24} className="text-(--color-purple-bright)" />
                                    </div>
                                    <p className="text-sm font-medium">Select a showtime to see the seat map</p>
                                </div>
                            )}

                            {selectedShowId && loadingSeats && (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin" />
                                    <p className="text-sm text-(--color-text-muted)">Loading seats…</p>
                                </div>
                            )}

                            {selectedShowId && !loadingSeats && seats.length > 0 && (
                                <div className="flex flex-col gap-2 min-w-max mx-auto">
                                    {rowLabels.map((row) => {
                                        const rowSeats = seatsByRow[row];
                                        // split into two halves for the cinema aisle look
                                        const mid = Math.ceil(rowSeats.length / 2);
                                        const left = rowSeats.slice(0, mid);
                                        const right = rowSeats.slice(mid);

                                        return (
                                            <div key={row} className="flex items-center gap-4">
                                                {/* Row label left */}
                                                <span className="w-5 text-center text-xs font-bold text-(--color-text-muted) font-(family-name:--font-display) shrink-0">
                                                    {row}
                                                </span>

                                                {/* Left block */}
                                                <div className="flex gap-1.5">
                                                    {left.map((seat) => (
                                                        <Seat
                                                            key={seat.id}
                                                            seat={seat}
                                                            showSeat={showSeatMap[seat.id]}
                                                            isSelected={selectedSeatIds.has(seat.id)}
                                                            onToggle={toggleSeat}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Aisle gap */}
                                                <div className="w-6 shrink-0" />

                                                {/* Right block */}
                                                <div className="flex gap-1.5 ml-0 md:ml-[25%] lg:ml-[30%]">
                                                    {right.map((seat) => (
                                                        <Seat
                                                            key={seat.id}
                                                            seat={seat}
                                                            showSeat={showSeatMap[seat.id]}
                                                            isSelected={selectedSeatIds.has(seat.id)}
                                                            onToggle={toggleSeat}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Row label right */}
                                                <span className="w-5 text-center text-xs font-bold text-(--color-text-muted) font-(family-name:--font-display) shrink-0">
                                                    {row}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedShowId && !loadingSeats && seats.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 text-(--color-text-muted)">
                                    <Info size={24} className="text-(--color-warning)" />
                                    <p className="text-sm">No seat data available for this show.</p>
                                </div>
                            )}
                        </div>
                    </section>


                    {showAuthModal && (
                        <AuthModalManager
                            trigger={openAuthModal ? "unauthenticated" : null}
                            onClose={() => setShowAuthModal(false)}
                            onSuccess={() => setShowAuthModal(false)}
                        />
                    )}

                    {/* ────────────────────────────────────────
                        RIGHT PANEL — Summary & Checkout
                    ──────────────────────────────────────── */}
                    <aside className="flex flex-col gap-4 sticky top-6">

                        {/* Show info card */}
                        {selectedShow && (
                            <div className="card rounded-xl border border-(--color-border-default) bg-(--color-surface) p-5">
                                <p className="eyebrow mb-3">Your Show</p>
                                <div className="flex flex-col gap-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={14} className="text-(--color-accent) mt-0.5 shrink-0" />
                                        <div>
                                            <span className="block text-(--color-text-primary) font-semibold">
                                                {formatDate(selectedShow.startTime)}
                                            </span>
                                            <span className="text-(--color-text-muted)">
                                                {formatTime(selectedShow.startTime)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={14} className="text-(--color-accent) mt-0.5 shrink-0" />
                                        <div>
                                            <span className="block text-(--color-text-primary) font-semibold">
                                                {selectedShow.screen?.cinema?.name ?? "—"}
                                            </span>
                                            <span className="text-(--color-text-muted)">
                                                {selectedShow.screen?.cinema?.city} · {selectedShow.screen?.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selected seats breakdown */}
                        <div className="card rounded-xl border border-(--color-border-default) bg-(--color-surface) p-5 flex flex-col gap-4">
                            <p className="eyebrow">Tickets</p>

                            {selectedSeats.length === 0 ? (
                                <p className="text-sm text-(--color-text-muted)">
                                    {selectedShowId ? "Tap seats on the map to select them." : "Choose a show first, then pick your seats."}
                                </p>
                            ) : (
                                <>
                                    {/* Dashed ticket divider */}
                                    <div className="relative border-t border-dashed border-(--color-border-default) -mx-5 px-5" />

                                    {/* Seat rows */}
                                    <div className="flex flex-col gap-2">
                                        {selectedSeats.map((seat) => (
                                            <div key={seat.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-9 h-7 rounded-t-md border bg-(--color-accent) border-(--color-accent) text-(--color-accent-text) text-xs font-bold flex items-center justify-center font-(family-name:--font-display)">
                                                        {seat.rowLabel}{seat.seatNumber}
                                                    </span>
                                                    <div>
                                                        <span className="block text-(--color-text-primary) font-medium leading-tight">
                                                            Row {seat.rowLabel}, Seat {seat.seatNumber}
                                                        </span>
                                                        <span className="text-xs text-(--color-text-muted) capitalize">
                                                            {seat.seatType?.toLowerCase() ?? "standard"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-(--color-text-primary) font-semibold font-(family-name:--font-display)">
                                                        Rs.{getSeatPrice(seat)}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleSeat(seat)}
                                                        className="w-5 h-5 rounded-full bg-(--color-danger-dim) border border-(--color-danger)/30 flex items-center justify-center text-(--color-danger) hover:bg-(--color-danger) hover:text-(--color-danger-text) transition-colors cursor-pointer"
                                                        aria-label="Remove seat"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dashed divider */}
                                    <div className="relative border-t border-dashed border-(--color-border-default) -mx-5 px-5" />

                                    {/* Totals */}
                                    <div className="flex flex-col gap-2 text-sm">
                                        <div className="flex justify-between text-(--color-text-muted)">
                                            <span>{selectedSeats.length} ticket{selectedSeats.length > 1 ? "s" : ""}</span>
                                            <span>Rs.{totalPrice}</span>
                                        </div>
                                        <div className="flex justify-between text-(--color-text-muted)">
                                            <span>Convenience fee</span>
                                            <span>Rs.0.00</span>
                                        </div>
                                        <div className="flex justify-between text-(--color-text-primary) font-bold font-(family-name:--font-display) text-lg mt-1">
                                            <span>Total</span>
                                            <span className="text-(--color-accent)">Rs.{totalPrice}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Coupon Section */}
                        <div className="mt-6 bg-(--color-bg-card) border border-(--color-border-default) rounded-2xl p-4">
                            <p className="text-(--color-text-primary) font-(family-name:--font-display)">Got a Coupon? Enter here</p>
                            <div className="flex flex-col gap-2 mt-4 items-start">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder="Enter coupon code"
                                    className="input input-md flex-1 text-(--color-text-secondary) border border-(--color-border-default) bg-(--color-bg-card) rounded-lg px-4 py-2 outline-0"
                                />
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={isAuthenticated ? handleSubmit : () => openAuthModal("login")}
                            disabled={isBooking}
                            className={`btn btn-lg w-full justify-center font-(family-name:--font-display) tracking-wide
                                ${selectedSeats.length > 0
                                    ? "link-button"
                                    : "bg-(--color-surface-raised) border border-(--color-border-default) text-(--color-text-disabled) cursor-not-allowed pointer-events-none"
                                }`}
                            aria-disabled={selectedSeats.length === 0}
                        >
                            {isBooking ? <Loader2 size={18} /> : <Ticket size={18} />}
                            {selectedSeats.length > 0
                                ? isBooking ? "Booking..." : `Proceed to Payment · Rs.${totalPrice}`
                                : "Select Seats to Continue"}
                        </button>

                        {selectedSeats.length > 0 && (
                            <p className="text-xs text-(--color-text-muted) text-center leading-relaxed">
                                Seats are held for <span className="text-(--color-accent) font-semibold">10 minutes</span> after you proceed.
                            </p>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
};

export default BookingPage;
