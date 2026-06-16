"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { Film, MapPin, Calendar, Ticket, ShieldCheck, Lock } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

/* ─── Stripe Elements appearance tuned to Void & Volt tokens ─── */
const stripeAppearance = {
    theme: "night",
    variables: {
        colorPrimary: "#FEE505",
        colorBackground: "#12111A",
        colorText: "#E8E6F0",
        colorTextSecondary: "#9896A8",
        colorDanger: "#FF5A5A",
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: "10px",
        colorIconTab: "#9896A8",
        colorIconTabSelected: "#FEE505",
        spacingUnit: "4px",
        focusBoxShadow: "0 0 0 3px rgba(254, 229, 5, 0.25)",
        focusOutline: "none",
    },
    rules: {
        ".Input": {
            border: "1px solid #2E2C3D",
            backgroundColor: "#0D0C14",
            color: "#E8E6F0",
            padding: "12px 14px",
            fontSize: "14px",
            transition: "border-color 0.15s",
        },
        ".Input:focus": {
            border: "1px solid #FEE505",
            boxShadow: "0 0 0 3px rgba(254, 229, 5, 0.15)",
        },
        ".Input--invalid": {
            border: "1px solid #FF5A5A",
        },
        ".Label": {
            color: "#9896A8",
            fontSize: "12px",
            fontWeight: "500",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "6px",
        },
        ".Tab": {
            border: "1px solid #2E2C3D",
            backgroundColor: "#0D0C14",
        },
        ".Tab:hover": {
            border: "1px solid #4D4767",
        },
        ".Tab--selected": {
            border: "1px solid #FEE505",
            backgroundColor: "#1C1A28",
        },
        ".Error": {
            color: "#FF5A5A",
            fontSize: "12px",
        },
        ".Block": {
            backgroundColor: "#0D0C14",
            border: "1px solid #2E2C3D",
        },
    },
};

/* ─── Booking summary card ─── */
function BookingSummary({ summary }) {
    if (!summary) return null;

    const {
        movieTitle,
        cinemaName,
        screenName,
        showDate,
        showTime,
        seats,
        totalAmount,
        currency,
    } = summary;

    return (
        <div className="flex flex-col gap-5">
            {/* Movie info */}
            <div className="card rounded-xl border border-(--color-border-default) bg-(--color-surface) p-5">
                <p className="eyebrow mb-4">Booking Summary</p>

                <div className="flex flex-col gap-3 text-sm">
                    {movieTitle && (
                        <div className="flex items-start gap-3">
                            <Film size={14} className="text-(--color-accent) mt-0.5 shrink-0" />
                            <span className="text-(--color-text-primary) font-semibold leading-snug">
                                {movieTitle}
                            </span>
                        </div>
                    )}
                    {cinemaName && (
                        <div className="flex items-start gap-3">
                            <MapPin size={14} className="text-(--color-accent) mt-0.5 shrink-0" />
                            <div>
                                <span className="block text-(--color-text-primary) font-medium">{cinemaName}</span>
                                {screenName && (
                                    <span className="text-(--color-text-muted) text-xs">{screenName}</span>
                                )}
                            </div>
                        </div>
                    )}
                    {(showDate || showTime) && (
                        <div className="flex items-start gap-3">
                            <Calendar size={14} className="text-(--color-accent) mt-0.5 shrink-0" />
                            <div>
                                {showDate && (
                                    <span className="block text-(--color-text-primary) font-medium">{showDate}</span>
                                )}
                                {showTime && (
                                    <span className="text-(--color-text-muted) text-xs">{showTime}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Seats */}
            {seats?.length > 0 && (
                <div className="card rounded-xl border border-(--color-border-default) bg-(--color-surface) p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Ticket size={14} className="text-(--color-accent)" />
                        <p className="eyebrow">
                            {seats.length} Ticket{seats.length > 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {seats.map((seat, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-9 h-7 rounded-t-md border bg-(--color-accent) border-(--color-accent) text-(--color-accent-text) text-[10px] font-bold flex items-center justify-center font-(family-name:--font-display)">
                                        {seat.label}
                                    </span>
                                    <span className="text-(--color-text-muted) capitalize text-xs">
                                        {seat.type?.toLowerCase() ?? "standard"}
                                    </span>
                                </div>
                                <span className="text-(--color-text-primary) font-semibold font-(family-name:--font-display) text-sm">
                                    {currency?.toUpperCase() === "USD" ? "$" : currency}{seat.price}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Dashed divider */}
                    <div className="border-t border-dashed border-(--color-border-default) my-4 -mx-5" />

                    <div className="flex justify-between items-center">
                        <span className="text-(--color-text-muted) text-sm">Total</span>
                        <span className="text-(--color-accent) font-extrabold font-(family-name:--font-display) text-xl">
                            {currency?.toUpperCase() === "USD" ? "$" : currency}{totalAmount}
                        </span>
                    </div>
                </div>
            )}

            {/* Security badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) text-xs text-(--color-text-muted)">
                <Lock size={13} className="text-(--color-success) shrink-0" />
                <span>Payment secured by Stripe. Your card details are never stored on our servers.</span>
            </div>
        </div>
    );
}

/* ─── Skeleton loader while Stripe initialises ─── */
function PaymentFormSkeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-(--color-surface-raised)" />
            ))}
            <div className="h-12 rounded-lg bg-(--color-accent)/20 mt-2" />
        </div>
    );
}

/* ─── Inner page (needs searchParams) ─── */
function CheckoutInner() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const clientSecret = searchParams.get("clientSecret");
    const paymentId = searchParams.get("paymentId");

    // Booking summary passed via sessionStorage (set before redirect in BookingPage)
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("ticketify_booking_summary");
            if (raw) setSummary(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    if (!clientSecret) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page)">
                <div className="text-center">
                    <p className="text-(--color-text-muted) mb-4">No payment session found.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="btn btn-md link-button"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen mt-20 bg-(--color-bg-page) text-(--color-text-secondary) font-(family-name:--font-body)">

            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-(--color-accent)/5 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">

                {/* Header */}
                <div className="mb-10">
                    <p className="eyebrow mb-1">Step 2 of 2</p>
                    <h1 className="font-(family-name:--font-display) text-3xl md:text-4xl font-extrabold text-(--color-text-primary) tracking-tight m-0">
                        Complete Payment
                    </h1>
                    <p className="text-(--color-text-muted) text-sm mt-2 m-0">
                        Your seats are held for{" "}
                        <span className="text-(--color-accent) font-semibold">10 minutes</span>.
                        Finish payment to confirm your booking.
                    </p>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

                    {/* LEFT — Stripe Payment Form */}
                    <div className="card rounded-2xl border border-(--color-border-default) bg-(--color-surface) p-6 md:p-8">

                        {/* Accepted cards row */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-(--color-text-primary) font-semibold text-sm">
                                Pay with Card
                            </p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-(--color-success)" />
                                <span className="text-xs text-(--color-success) font-medium">Secure</span>
                            </div>
                        </div>

                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: stripeAppearance,
                            }}
                        >
                            <Suspense fallback={<PaymentFormSkeleton />}>
                                <CheckoutForm paymentId={paymentId} />
                            </Suspense>
                        </Elements>
                    </div>

                    {/* RIGHT — Booking Summary */}
                    <div className="lg:sticky lg:top-6">
                        <BookingSummary summary={summary} />
                    </div>
                </div>
            </div>
        </main>
    );
}

/* ─── Export (Suspense boundary for useSearchParams) ─── */
export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page)">
                <div className="w-8 h-8 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin" />
            </div>
        }>
            <CheckoutInner />
        </Suspense>
    );
}