import { Suspense } from "react";
import ConfirmationClient from "@/components/checkout/Success";

export const metadata = {
    title: "Booking Confirmation — Ticketify",
    description: "Your booking confirmation details",
};

export default function ConfirmationPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page)">
                    <div className="w-8 h-8 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin" />
                </div>
            }
        >
            <ConfirmationClient />
        </Suspense>
    );
}