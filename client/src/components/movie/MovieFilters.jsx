"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

const LANGUAGES = ["English", "Hindi", "Urdu", "Punjabi", "Pashto"];

const MovieFilters = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(searchParams.get("search") || "");

    const updateParam = useCallback((key, value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        startTransition(() => {
            router.push(`/movies?${params.toString()}`);
        });
    }, [searchParams, router]);

    const clearAll = () => {
        setSearch("");
        startTransition(() => {
            router.push("/movies");
        });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") updateParam("search", search);
        if (e.key === "Escape" || (e.key === "Backspace" && search === "")) {
            setSearch("");
            updateParam("search", "");
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        // Auto-clear results when input is fully cleared
        if (val === "") updateParam("search", "");
    };

    const hasActiveFilters = ["search", "language", "genreSlug", "castSlug"].some(
        (k) => searchParams.get(k)
    );

    return (
        <div className={`px-10 py-5 flex flex-wrap items-center gap-3 border-b border-(--color-border) transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>

            {/* Search */}
            <div className="flex items-center gap-2 bg-(--color-bg-subtle) border border-(--color-border) rounded-lg px-3 py-2 flex-1 min-w-48 max-w-72 focus-within:border-(--color-accent) transition-colors">
                {isPending
                    ? <span className="w-4 h-4 rounded-full border-2 border-(--color-accent) border-t-transparent animate-spin shrink-0" />
                    : <Search size={16} className="text-(--color-text-secondary) shrink-0" />
                }
                <input
                    type="text"
                    placeholder="Search movies..."
                    value={search}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) outline-none w-full"
                />
                {search && (
                    <button
                        onClick={() => { setSearch(""); updateParam("search", ""); }}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors shrink-0"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* <div className="relative">
                <select
                    value={searchParams.get("language") || ""}
                    onChange={(e) => updateParam("language", e.target.value)}
                    className="appearance-none bg-(--color-bg-subtle) border border-(--color-border) rounded-lg pl-3 pr-8 py-2 text-sm text-(--color-text-primary) outline-none cursor-pointer hover:border-(--color-accent) focus:border-(--color-accent) transition-colors"
                >
                    <option value="">All Languages</option>
                    {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--color-text-secondary)">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div> */}

            {/* Active filter chips */}
            {searchParams.get("genreSlug") && (
                <Chip label={`Genre: ${searchParams.get("genreSlug")}`} onRemove={() => updateParam("genreSlug", "")} />
            )}
            {searchParams.get("castSlug") && (
                <Chip label={`Cast: ${searchParams.get("castSlug")}`} onRemove={() => updateParam("castSlug", "")} />
            )}

            {/* Clear all */}
            {hasActiveFilters && (
                <button
                    onClick={clearAll}
                    className="ml-auto text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) underline underline-offset-2 transition-colors"
                >
                    Clear all
                </button>
            )}
        </div>
    );
};

const Chip = ({ label, onRemove }) => (
    <div className="flex items-center gap-1.5 bg-(--color-cta)/10 text-(--color-cta) text-sm px-3 py-1.5 rounded-full border border-(--color-cta)/20">
        <span>{label}</span>
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity" aria-label={`Remove ${label} filter`}>
            <X size={12} />
        </button>
    </div>
);

export default MovieFilters;
