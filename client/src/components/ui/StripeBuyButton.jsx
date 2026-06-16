// components/CheckoutForm.jsx
"use client";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePay = async () => {
        if (!stripe || !elements) return;
        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Stripe redirects here after 3DS / bank auth
                return_url: `${window.location.origin}/success`,
            },
        });

        // Only reaches here if there's an immediate error
        // (redirect happens automatically on success)
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div>
            <PaymentElement />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button onClick={handlePay} disabled={loading || !stripe}>
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </div>
    );
}