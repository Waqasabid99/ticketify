"use client";

import { useEffect } from "react";
import { RefreshCcw, Home, AlertTriangle } from "lucide-react";
import "./globals.css";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error("Global error boundary caught:", error);
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-(--color-bg-page) text-(--color-text-secondary) font-(family-name:--font-body) antialiased">
                <main className="min-h-screen flex items-center justify-center px-6 relative">

                    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-(--color-danger)/10 blur-[120px]" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-(--color-danger-dim) border border-(--color-danger)/30 mb-5">
                            <AlertTriangle size={26} className="text-(--color-danger)" />
                        </div>

                        <p className="eyebrow mb-2">Unexpected error</p>

                        <h1 className="font-(family-name:--font-display) text-2xl sm:text-3xl font-extrabold text-(--color-text-primary) tracking-tight m-0">
                            Something went wrong
                        </h1>

                        <p className="text-sm text-(--color-text-muted) mt-3 max-w-sm">
                            The show couldn't go on. Our team has been notified — try again, or head back home.
                        </p>

                        {process.env.NODE_ENV === "development" && error?.message && (
                            <pre className="text-xs text-(--color-danger) bg-(--color-surface) border border-(--color-border-default) rounded-lg p-3 mt-4 max-w-full overflow-x-auto text-left">
                                {error.message}
                            </pre>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
                            <button
                                onClick={() => reset()}
                                className="btn btn-primary btn-lg flex items-center justify-center gap-2"
                            >
                                <RefreshCcw size={16} />
                                Try again
                            </button>
                            <Link
                                href="/"
                                className="btn btn-lg link-button flex items-center justify-center gap-2"
                            >
                                <Home size={16} />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    );
}