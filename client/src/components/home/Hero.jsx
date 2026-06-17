"use client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeftIcon, ChevronRightIcon, Clock, Play, Ticket } from "lucide-react";
import { formatDuration, formatYear, StarRating, StatusBadge } from "@/utils/constants";
import Image from "next/image";
import { StarsDisplay } from "../ui/MovieReviews";

const Hero = ({ movies = [] }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 6000, stopOnInteraction: true }),
    ]);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        onSelect();
        return () => emblaApi.off("select", onSelect);
    }, [emblaApi]);

    if (!movies.length) return null;

    return (
        <section
            className="embla relative overflow-hidden min-h-130 h-[85vh] md:h-screen"
            aria-label="Featured movies"
        >
            {/* ── Carousel viewport ── */}
            <div className="embla__viewport h-full" ref={emblaRef}>
                <div className="embla__container h-full">
                    {movies.map((movie) => {
                        const genres = movie.genres?.map((g) => g.genre?.name).filter(Boolean) ?? [];
                        const year = formatYear(movie.releaseDate);
                        const duration = formatDuration(movie.durationMinutes);

                        return (
                            <div className="embla__slide relative h-full" key={movie.id}>
                                {/* ── Banner image ── */}
                                <Image
                                    priority
                                    fill
                                    sizes="100vw"
                                    src={movie.bannerUrl}
                                    alt={movie.title}
                                    className="object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-transparent" />

                                {/* ── Left-to-right gradient scrim ── */}
                                <div className="absolute inset-0 bg-lineargradient-to-r from-[rgba(10,6,30,0.92)] via-[rgba(10,6,30,0.45)] to-transparent" />

                                {/* ── Bottom gradient scrim ── */}
                                <div className="absolute inset-0 bg-linear-to-t from-[rgba(10,6,30,0.85)] via-transparent to-transparent" />

                                {/* ── Right-side info panel (hidden on mobile, shown md+) ── */}
                                <div className="absolute bottom-0 right-0 z-10 hidden md:flex flex-col items-end text-right px-10 pb-16 gap-2 max-w-sm">
                                    {movie.language && (
                                        <p className="text-xs font-(--font-body) tracking-wide text-(--color-text-muted)">
                                            <span className="text-(--color-text-primary)">Language</span>
                                            <span className="text-(--color-info) ml-1.5">{movie.language}</span>
                                        </p>
                                    )}

                                    {/* Description */}
                                    <p className="text-sm md:text-md text-(--color-text-primary) font-(--font-body) leading-relaxed mt-1 line-clamp-4">
                                        {movie.description}
                                    </p>
                                </div>

                                {/* ── Left-side main info panel ── */}
                                <div className="absolute bottom-0 left-0 z-10 flex flex-col px-5 pb-10 gap-2.5 w-full md:w-auto md:max-w-lg md:px-10 md:pb-14 md:gap-3">
                                    {/* Genres + status row */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {genres.length > 0 && (
                                            <span className="text-xs text-(--color-text-muted) font-(--font-body) tracking-wide">
                                                {genres.join(", ")}
                                            </span>
                                        )}
                                        <StatusBadge status={movie.status} />
                                    </div>

                                    {/* Title */}
                                    <h1 className="font-(--font-display) text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight text-(--color-text-primary) m-0">
                                        {movie.title}
                                    </h1>

                                    {/* Description — visible on mobile only, below title */}
                                    <p className="block md:hidden text-sm text-(--color-text-primary) font-(--font-body) leading-relaxed line-clamp-3">
                                        {movie.description}
                                    </p>

                                    {/* Meta row: year · duration · age */}
                                    <div className="flex items-center gap-3 md:gap-4 flex-wrap text-sm text-(--color-text-muted)">
                                        {year && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {year}
                                            </span>
                                        )}
                                        {duration && (
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                {duration}
                                            </span>
                                        )}
                                        {movie.ageRestriction && (
                                            <span className="px-2 py-0.5 text-xs font-semibold border border-(--color-border-strong) rounded-sm text-(--color-text-muted) tracking-wide">
                                                {movie.ageRestriction}+
                                            </span>
                                        )}
                                    </div>

                                    {/* Star rating */}
                                    <StarsDisplay value={movie.ratingReviews?.[0]?.rating || 0} />

                                    {/* CTA buttons */}
                                    <div className="flex items-center gap-2 md:gap-3 mt-1 flex-wrap">
                                        <Link
                                            href={`movie/${movie.slug}/book`}
                                            className="link-button btn-sm flex items-center gap-2"
                                        >
                                            <Ticket className="w-4 h-4" />
                                            Book Tickets
                                        </Link>

                                        {movie.trailerUrl && (
                                            <Link
                                                href={movie.trailerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="link-button-info btn-sm flex items-center gap-2"
                                            >
                                                <Play className="w-4 h-4" />
                                                Trailer
                                            </Link>
                                        )}

                                        <Link
                                            href={`movie/${movie.slug}`}
                                            className="btn btn-ghost btn-sm"
                                        >
                                            More Info
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Dot navigation (center bottom) ── */}
            <div
                className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
                role="tablist"
                aria-label="Slide navigation"
            >
                {movies.map((_, i) => (
                    <button
                        key={i}
                        role="tab"
                        aria-selected={i === selectedIndex}
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => scrollTo(i)}
                        className={[
                            "h-2 border-none cursor-pointer p-0 shrink-0 transition-[width,background-color] duration-300 ease-in-out rounded-full",
                            i === selectedIndex
                                ? "w-7 bg-(--color-accent)"
                                : "w-2 bg-(--color-border-strong)",
                        ].join(" ")}
                    />
                ))}
            </div>

            {/* ── Arrow navigation (desktop only) ── */}
            <button
                onClick={scrollPrev}
                aria-label="Previous slide"
                className="btn btn-ghost btn-icon hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-(--color-scrim) backdrop-blur-sm border border-(--color-border-subtle)"
            >
                <ChevronLeftIcon />
            </button>

            <button
                onClick={scrollNext}
                aria-label="Next slide"
                className="btn btn-ghost btn-icon hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-(--color-scrim) backdrop-blur-sm border border-(--color-border-subtle)"
            >
                <ChevronRightIcon />
            </button>
        </section>
    );
};

export default Hero;
