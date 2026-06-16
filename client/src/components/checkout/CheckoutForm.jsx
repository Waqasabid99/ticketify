"use client";

import { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Lock, Loader2, CreditCard } from "lucide-react";

export default function CheckoutForm({ paymentId }) {
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const handlePay = async () => {
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        // Trigger form validation inside Stripe Element
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message);
            setIsProcessing(false);
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Stripe will redirect here after 3DS / bank auth
                return_url: `${window.location.origin}/success${paymentId ? `?paymentId=${paymentId}` : ""}`,
            },
        });

        // We only reach here on an immediate error (e.g. card declined before redirect)
        if (error) {
            setErrorMessage(error.message ?? "Payment failed. Please try again.");
            setIsProcessing(false);
        }
        // On success, Stripe handles the redirect — no further code runs here.
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Stripe Payment Element */}
            <div className={`transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}>
                <PaymentElement
                    onReady={() => setIsReady(true)}
                    options={{
                        layout: "tabs",
                        paymentMethodOrder: ["card", "apple_pay", "google_pay"],
                    }}
                />
            </div>

            {/* Skeleton shown while Stripe loads */}
            {!isReady && (
                <div className="flex flex-col gap-4 animate-pulse -mt-[inherit]">
                    <div className="h-10 rounded-lg bg-(--color-surface-raised)" />
                    <div className="h-12 rounded-lg bg-(--color-surface-raised)" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-12 rounded-lg bg-(--color-surface-raised)" />
                        <div className="h-12 rounded-lg bg-(--color-surface-raised)" />
                    </div>
                </div>
            )}

            {/* Error message */}
            {errorMessage && (
                <div className="px-4 py-3 rounded-lg border border-(--color-danger)/40 bg-(--color-danger-dim) text-(--color-danger) text-sm flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-(--color-border-subtle) -mx-8" />

            {/* Pay button */}
            <button
                onClick={handlePay}
                disabled={!stripe || !elements || isProcessing || !isReady}
                className={`btn btn-lg w-full justify-center font-(family-name:--font-display) tracking-wide transition-all
                    ${stripe && elements && isReady && !isProcessing
                        ? "link-button"
                        : "bg-(--color-surface-raised) border border-(--color-border-default) text-(--color-text-disabled) cursor-not-allowed"
                    }`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing…
                    </>
                ) : (
                    <>
                        <Lock size={16} />
                        Pay Now
                    </>
                )}
            </button>

            {/* Fine print */}
            <p className="text-xs text-(--color-text-muted) text-center leading-relaxed">
                By completing payment you agree to our{" "}
                <a href="/terms" className="text-(--color-accent) hover:underline">Terms of Service</a>.
                {" "}Tickets are non-refundable after confirmation.
            </p>
        </div>
    );
}