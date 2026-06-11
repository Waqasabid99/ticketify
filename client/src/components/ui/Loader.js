const sizeMap = {
    sm: { ring: "w-5 h-5", border: "border-2", dot: "w-1.5 h-1.5", bar: "w-1 h-4", text: "text-xs" },
    md: { ring: "w-8 h-8", border: "border-2", dot: "w-2 h-2", bar: "w-1.5 h-6", text: "text-sm" },
    lg: { ring: "w-12 h-12", border: "border-[3px]", dot: "w-2.5 h-2.5", bar: "w-2 h-8", text: "text-base" },
    xl: { ring: "w-16 h-16", border: "border-4", dot: "w-3 h-3", bar: "w-2.5 h-10", text: "text-lg" },
};

function SpinnerRing({ size, loaderColor }) {
    const s = sizeMap[size];
    return (
        <span
            className={`${s.ring} ${s.border} rounded-full animate-spin border-(--color-purple)`}
            style={{
                borderTopColor: loaderColor,
            }}
            role="presentation"
            aria-hidden="true"
        />
    );
}

function DotsLoader({ size, loaderColor }) {
    const s = sizeMap[size];
    return (
        <span className="flex items-center gap-1.5" role="presentation" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className={`${s.dot} rounded-full`}

                    style={{
                        backgroundColor: loaderColor,
                        animation: "ticketify-bounce 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`
                    }}
                />
            ))}
        </span>
    );
}

function BarsLoader({ size, loaderColor }) {
    const s = sizeMap[size];
    return (
        <span className="flex items-end gap-1" role="presentation" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
                <span
                    key={i}
                    className={`${s.bar} rounded-sm`}
                    style={{
                        backgroundColor: loaderColor,
                        animation: "ticketify-bars 1s ease-in-out infinite",
                        animationDelay: `${i * 0.15}s`
                    }}
                />
            ))}
        </span>
    );
}

function PulseLoader({ size, loaderColor }) {
    const s = sizeMap[size];
    return (
        <span className="relative flex" role="presentation" aria-hidden="true">
            <span
                className={`${s.ring} rounded-full opacity-75 absolute`}
                style={{
                    backgroundColor: `var(${loaderColor})`,
                    animation: "ticketify-ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite"
                }}
            />
            <span
                className={`${s.ring} rounded-full bg-(--color-accent-dim) border-2 border-(--color-accent)`}
            />
        </span>
    );
}

const variantMap = {
    spinner: SpinnerRing,
    dots: DotsLoader,
    bars: BarsLoader,
    pulse: PulseLoader,
};

export default function Loader({
    variant = "spinner",
    size = "md",
    text = "",
    fullPage = false,
    overlay = false,
    className = "",
    loaderColor = "(--color-accent-text)",
    inline = false,
}) {
    const LoaderVariant = variantMap[variant] || SpinnerRing;

    const inner = (
        <div
            className={`flex ${inline ? "flex-row" : "flex-col"} items-center justify-center gap-3 ${className}`}
            role="status"
            aria-label={text || "Loading"}
            aria-live="polite"
        >
            <LoaderVariant size={size} loaderColor={loaderColor} />
            {text && (
                <p className={`${sizeMap[size].text} tracking-wide text-(--color-text-muted) font-(--font-body)`}>
                    {text}
                </p>
            )}
            <span className="sr-only">{text || "Loading, please wait."}</span>

            {/* Keyframe injection — only one instance renders these */}
            <style>{`
        @keyframes ticketify-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes ticketify-bars {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes ticketify-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
        </div>
    );

    if (fullPage) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center bg-(--color-bg-page) z-(--z-overlay)"
                aria-busy="true"
            >
                {inner}
            </div>
        );
    }

    if (overlay) {
        return (
            <div
                className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-(--color-overlay) z-(--z-overlay)"
                aria-busy="true"
            >
                {inner}
            </div>
        );
    }

    return <div aria-busy="true">{inner}</div>;
}
