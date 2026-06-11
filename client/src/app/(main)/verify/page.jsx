import Link from "next/link";
import { verifyEmail } from "@/actions/verifyEmail.action";
import { Ticket, CheckCircle, XCircle, ArrowRight, Clock } from "lucide-react";

export const metadata = {
    title: "Verify Email — Ticketify",
    description: "Verify your email address to activate your Ticketify account.",
};

/* ─── tiny sub-components ─────────────────────── */

const Logo = () => (
    <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-(--color-accent) flex items-center justify-center">
            <Ticket size={16} className="text-(--color-accent-text)" strokeWidth={2.5} />
        </div>
        <span
            className="text-xl font-extrabold tracking-tight text-(--color-text-primary)"
            style={{ fontFamily: "var(--font-display)" }}
        >
            Ticketify
        </span>
    </div>
);

/* Animated ring that pulses around the status icon */
const IconRing = ({ success }) => (
    <div className="relative flex items-center justify-center w-20 h-20">
        {/* Outer pulse ring */}
        <div
            className={`
                absolute inset-0 rounded-full opacity-20
                ${success ? "bg-(--color-success)" : "bg-(--color-danger)"}
            `}
            style={{ animation: "ticketify-ping 2s cubic-bezier(0,0,0.2,1) infinite" }}
            aria-hidden="true"
        />
        {/* Mid ring */}
        <div
            className={`
                absolute inset-2 rounded-full opacity-15
                ${success ? "bg-(--color-success)" : "bg-(--color-danger)"}
            `}
            aria-hidden="true"
        />
        {/* Icon container */}
        <div
            className={`
                relative z-10 w-14 h-14 rounded-full flex items-center justify-center
                ${success
                    ? "bg-(--color-success-dim) border border-(--color-success)/30"
                    : "bg-(--color-danger-dim) border border-(--color-danger)/30"
                }
            `}
        >
            {success
                ? <CheckCircle size={28} className="text-(--color-success)" strokeWidth={1.75} />
                : <XCircle size={28} className="text-(--color-danger)" strokeWidth={1.75} />
            }
        </div>

        <style>{`
            @keyframes ticketify-ping {
                0%   { transform: scale(1);   opacity: 0.2; }
                70%  { transform: scale(1.6); opacity: 0; }
                100% { transform: scale(1.6); opacity: 0; }
            }
        `}</style>
    </div>
);

const VerifyEmailPage = async ({ searchParams }) => {
    const { token } = await searchParams;
    const data = await verifyEmail(token);
    const success = !!data?.success;

    return (
        <main
            className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-(--color-bg-page)"
            style={{ fontFamily: "var(--font-body)" }}
        >
            {/* Meta refresh — only injected on success */}
            {/* {success && (
                <head>
                    <meta httpEquiv="refresh" content="5;url=/login" />
                </head>
            )} */}

            {/* Card */}
            <div className="w-full max-w-sm flex flex-col items-center gap-8">

                {/* Status card */}
                <div className="w-full card flex flex-col items-center gap-6 text-center py-10 px-8">

                    <IconRing success={success} />

                    {/* Copy */}
                    <div className="flex flex-col gap-2">
                        <h1
                            className="text-2xl font-bold text-(--color-text-primary) tracking-tight"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            {success ? "Email verified!" : "Verification failed"}
                        </h1>
                        <p className="text-sm text-(--color-text-muted) leading-relaxed">
                            {success
                                ? (data?.message ?? "Your email has been confirmed. Your account is now active.")
                                : (data?.error ?? "This verification link is invalid or has expired.")
                            }
                        </p>
                    </div>

                    {/* CTA */}
                    {success ? (
                        <Link
                            href="/login"
                            className="btn btn-primary btn-lg link-muted w-full"
                        >
                            Go to login
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    ) : (
                        <div className="flex flex-col gap-3 w-full">
                            <Link
                                href="/login"
                                className="btn btn-outline-info w-full"
                            >
                                Back to login
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer note */}
                <p className="text-xs text-(--color-text-muted) text-center">
                    Need help?{" "}
                    <Link href="/support" className="link-accent">
                        Contact support
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default VerifyEmailPage;