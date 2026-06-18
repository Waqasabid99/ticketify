"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Ticket,
    Download,
    Home,
    RefreshCw,
    Calendar,
    MapPin,
    Film,
    Loader2,
} from "lucide-react";

/* ─── Poll booking status from your backend ─── */
async function fetchBookingStatus(paymentId) {
    if (!paymentId) return null;
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/payments/${paymentId}`,
            { credentials: "include" }
        );
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

/* ─── State configs ─── */
const STATES = {
    succeeded: {
        icon: CheckCircle2,
        iconClass: "text-(--color-success)",
        ringClass: "border-(--color-success)/30 bg-(--color-success)/5",
        glowClass: "bg-(--color-success)/10",
        badge: "badge badge-success",
        badgeLabel: "Payment Confirmed",
        headline: "You're all set!",
        subline: "Your booking is confirmed. Check your email for your tickets.",
    },
    processing: {
        icon: Clock,
        iconClass: "text-(--color-warning)",
        ringClass: "border-(--color-warning)/30 bg-(--color-warning)/5",
        glowClass: "bg-(--color-warning)/10",
        badge: "badge badge-warning",
        badgeLabel: "Processing",
        headline: "Payment is being processed",
        subline: "This usually takes a few seconds. Your tickets will arrive by email once confirmed.",
    },
    requires_payment_method: {
        icon: XCircle,
        iconClass: "text-(--color-danger)",
        ringClass: "border-(--color-danger)/30 bg-(--color-danger)/5",
        glowClass: "bg-(--color-danger)/10",
        badge: "badge badge-danger",
        badgeLabel: "Payment Failed",
        headline: "Payment was declined",
        subline: "Your card was not charged. You can try again with a different payment method.",
    },
    failed: {
        icon: XCircle,
        iconClass: "text-(--color-danger)",
        ringClass: "border-(--color-danger)/30 bg-(--color-danger)/5",
        glowClass: "bg-(--color-danger)/10",
        badge: "badge badge-danger",
        badgeLabel: "Payment Failed",
        headline: "Something went wrong",
        subline: "Your card was not charged. Please try again or contact support.",
    },
    loading: {
        icon: Loader2,
        iconClass: "text-(--color-accent) animate-spin",
        ringClass: "border-(--color-accent)/20 bg-(--color-accent)/5",
        glowClass: "bg-(--color-accent)/10",
        badge: null,
        headline: "Confirming your booking…",
        subline: "Please wait while we verify your payment.",
    },
};

/* ─── Booking detail row ─── */
function DetailRow({ icon: Icon, label, value, sub }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon size={14} className="text-(--color-accent) mt-0.5 shrink-0" />
            <div>
                <span className="block text-(--color-text-primary) font-medium">{value}</span>
                {sub && <span className="text-(--color-text-muted) text-xs">{sub}</span>}
            </div>
            <span className="ml-auto text-(--color-text-muted) text-xs">{label}</span>
        </div>
    );
}

/* ─── Seat pills ─── */
function SeatPill({ label }) {
    return (
        <span className="inline-flex items-center justify-center w-10 h-8 rounded-t-md border bg-(--color-accent) border-(--color-accent) text-(--color-accent-text) text-xs font-bold font-(family-name:--font-display)">
            {label}
        </span>
    );
}

/* ─── Main client component ─── */
export default function ConfirmationClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Stripe appends these on redirect
    const redirectStatus = searchParams.get("redirect_status"); // succeeded | processing | failed | requires_payment_method
    const paymentIntentId = searchParams.get("payment_intent");
    const paymentId = searchParams.get("paymentId"); // our internal payment UUID

    const [state, setState] = useState("loading");
    const [payment, setPayment] = useState(null);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        // Read booking summary stored before redirect
        try {
            const raw = sessionStorage.getItem("ticketify_booking_summary");
            if (raw) {
                setSummary(JSON.parse(raw));
                sessionStorage.removeItem("ticketify_booking_summary"); // clean up
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        async function resolve() {
            // If Stripe told us it succeeded, trust it immediately (webhook confirms async)
            if (redirectStatus === "succeeded") {
                setState("succeeded");

                // Optionally enrich with our payment record
                if (paymentId) {
                    const data = await fetchBookingStatus(paymentId);
                    if (data) setPayment(data);
                }
                return;
            }

            if (redirectStatus === "processing") {
                setState("processing");
                // Poll for up to 30s until webhook confirms
                let attempts = 0;
                const interval = setInterval(async () => {
                    attempts++;
                    const data = await fetchBookingStatus(paymentId);
                    if (data?.status === "SUCCESS" || data?.booking?.status === "CONFIRMED") {
                        clearInterval(interval);
                        setPayment(data);
                        setState("succeeded");
                    }
                    if (attempts >= 10) clearInterval(interval); // give up polling
                }, 3000);
                return;
            }

            if (
                redirectStatus === "requires_payment_method" ||
                redirectStatus === "failed" ||
                !redirectStatus
            ) {
                setState(redirectStatus ?? "failed");
                return;
            }

            setState("loading");
        }

        resolve();
    }, [redirectStatus, paymentId]);

    const config = STATES[state] ?? STATES.loading;
    const { icon: Icon, iconClass, ringClass, glowClass, badge, badgeLabel, headline, subline } = config;

    const bookingNumber = payment?.booking?.bookingNumber ?? summary?.bookingNumber;
    const isSuccess = state === "succeeded";
    const isFailed = state === "requires_payment_method" || state === "failed";

    return (
        <main className="min-h-screen mt-20 bg-(--color-bg-page) text-(--color-text-secondary) font-(family-name:--font-body) flex items-center justify-center px-4">

            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full ${glowClass} blur-[140px] transition-colors duration-700`} />
            </div>

            <div className="relative z-10 w-full max-w-lg">

                {/* ── Status Card ── */}
                <div className={`card rounded-2xl border ${ringClass} bg-(--color-surface) p-8 flex flex-col items-center text-center gap-5`}>

                    {/* Icon ring */}
                    <div className={`w-20 h-20 rounded-full border-2 ${ringClass} flex items-center justify-center`}>
                        <Icon size={36} className={iconClass} />
                    </div>

                    {/* Badge */}
                    {badge && (
                        <span className={badge}>{badgeLabel}</span>
                    )}

                    {/* Headline */}
                    <div>
                        <h1 className="font-(family-name:--font-display) text-2xl md:text-3xl font-extrabold text-(--color-text-primary) tracking-tight m-0 leading-tight">
                            {headline}
                        </h1>
                        <p className="text-(--color-text-muted) text-sm mt-2 m-0 leading-relaxed max-w-sm mx-auto">
                            {subline}
                        </p>
                    </div>

                    {/* Booking number */}
                    {bookingNumber && (
                        <div className="w-full px-5 py-3 rounded-xl bg-(--color-void-lifted) border border-(--color-border-default)">
                            <p className="text-xs text-(--color-text-muted) uppercase tracking-widest mb-1">Booking Reference</p>
                            <p className="font-(family-name:--font-display) text-lg font-bold text-(--color-accent) tracking-widest">
                                {bookingNumber}
                            </p>
                        </div>
                    )}

                    {/* Booking details (on success) */}
                    {isSuccess && summary && (
                        <div className="w-full flex flex-col gap-3 text-left border-t border-(--color-border-subtle) pt-5 mt-1">
                            <DetailRow icon={Film} label="Movie" value={summary.movieTitle} />
                            <DetailRow
                                icon={MapPin}
                                label="Venue"
                                value={summary.cinemaName}
                                sub={summary.screenName}
                            />
                            <DetailRow
                                icon={Calendar}
                                label="Show"
                                value={summary.showDate}
                                sub={summary.showTime}
                            />

                            {/* Seat pills */}
                            {summary.seats?.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <Ticket size={13} className="text-(--color-accent)" />
                                    <div className="flex gap-1.5 flex-wrap">
                                        {summary.seats.map((s, i) => (
                                            <SeatPill key={i} label={s.label} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Action buttons ── */}
                <div className="mt-5 flex flex-col gap-3">
                    {isSuccess && (
                        <>
                            <Link
                                href="/my-bookings"
                                className="btn btn-lg w-full justify-center link-button font-(family-name:--font-display) tracking-wide"
                            >
                                <Ticket size={18} />
                                View My Tickets
                            </Link>
                            <Link
                                href="/"
                                className="btn btn-md w-full justify-center bg-(--color-surface) border border-(--color-border-default) text-(--color-text-secondary) hover:border-(--color-border-strong) hover:text-(--color-text-primary) font-(family-name:--font-display)"
                            >
                                <Home size={16} />
                                Back to Home
                            </Link>
                        </>
                    )}

                    {isFailed && (
                        <>
                            <button
                                onClick={() => router.back()}
                                className="btn btn-lg w-full justify-center link-button font-(family-name:--font-display) tracking-wide"
                            >
                                <RefreshCw size={18} />
                                Try Payment Again
                            </button>
                            <Link
                                href="/"
                                className="btn btn-md w-full justify-center bg-(--color-surface) border border-(--color-border-default) text-(--color-text-secondary) hover:border-(--color-border-strong) hover:text-(--color-text-primary) font-(family-name:--font-display)"
                            >
                                <Home size={16} />
                                Back to Home
                            </Link>
                        </>
                    )}

                    {state === "processing" && (
                        <Link
                            href="/"
                            className="btn btn-md w-full justify-center bg-(--color-surface) border border-(--color-border-default) text-(--color-text-secondary) font-(family-name:--font-display)"
                        >
                            <Home size={16} />
                            We'll email you when it's confirmed
                        </Link>
                    )}
                </div>

                {/* Payment intent reference for support */}
                {paymentIntentId && (
                    <p className="text-center text-xs text-(--color-text-muted) mt-5 opacity-50">
                        Ref: {paymentIntentId}
                    </p>
                )}
            </div>
        </main>
    );
}