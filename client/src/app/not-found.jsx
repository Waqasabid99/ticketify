import Link from "next/link";
import { Home, Ticket } from "lucide-react";
import LottieAnimation from "@/components/ui/LottieAnimation";
import animationData from "../../public/animations/not-found.json";

export default function NotFound() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-(--color-bg-page) text-(--color-text-secondary) font-(family-name:--font-body) px-6">

            {/* Ambient glow, consistent with the rest of the site */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-(--color-accent)/5 blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                <LottieAnimation animationData={animationData} className="size-72" />

                <p className="eyebrow mb-2">Error 404</p>

                <h1 className="font-(family-name:--font-display) text-2xl sm:text-3xl font-extrabold text-(--color-text-primary) tracking-tight m-0">
                    This screening doesn't exist
                </h1>

                <p className="text-sm text-(--color-text-muted) mt-3 max-w-sm">
                    The page you're looking for may have been moved, renamed, or it never made it past the trailer.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
                    <Link
                        href="/"
                        className="btn btn-primary btn-lg flex items-center justify-center gap-2"
                    >
                        <Home size={16} />
                        Back to Home
                    </Link>
                    <Link
                        href="/movies"
                        className="btn btn-lg link-button flex items-center justify-center gap-2"
                    >
                        <Ticket size={16} />
                        Browse Movies
                    </Link>
                </div>
            </div>
        </main>
    );
}