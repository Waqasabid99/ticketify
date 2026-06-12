/**
 * generateMetadata.ts
 * ─────────────────────────────────────────────
 * Central factory that builds a Next.js `Metadata` object.
 * Every dynamic page calls one typed helper below which
 * calls this function — so all metadata stays consistent.
 *
 * Usage:
 *   import { generateMovieMetadata } from "@/lib/seo/generateMetadata";
 *   export const generateMetadata = ({ params }) =>
 *     generateMovieMetadata(movie);
 */

import { SITE, ROBOTS } from "./seo.config";
// ─── Core factory ─────────────────────────────────────────────────────────────

function buildMetadata(input) {
  const {
    title,
    description,
    canonicalUrl,
    ogImage = SITE.defaultOgImage,
    ogImageAlt = title,
    noindex = false,
    keywords,
  } = input;

  const absoluteCanonical = canonicalUrl.startsWith("http")
    ? canonicalUrl
    : `${SITE.url}${canonicalUrl}`;

  const absoluteOgImage = ogImage.startsWith("http")
    ? ogImage
    : `${SITE.url}${ogImage}`;

  const robots = noindex ? ROBOTS.noindex : ROBOTS.public;

  return {
    // ── Title ──────────────────────────────────────────────────────────────
    title: {
      default: `${title} | ${SITE.name}`,
      template: `%s | ${SITE.name}`,
    },
    // ── Description & keywords ────────────────────────────────────────────
    description,
    ...(keywords?.length ? { keywords } : {}),

    // ── Canonical ─────────────────────────────────────────────────────────
    alternates: {
      canonical: absoluteCanonical,
    },

    // ── Robots ────────────────────────────────────────────────────────────
    robots: {
      index: robots.index,
      follow: robots.follow,
      googleBot: {
        index: robots.index,
        follow: robots.follow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // ── Open Graph ────────────────────────────────────────────────────────
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url: absoluteCanonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },

    // ── Twitter / X ───────────────────────────────────────────────────────
    twitter: {
      card: "summary_large_image",
      site: SITE.twitterHandle,
      title: `${title} | ${SITE.name}`,
      description,
      images: [absoluteOgImage],
    },
  };
}

// ─── Per-page typed helpers ───────────────────────────────────────────────────

/** Data shape expected from your Movie API response */

export function generateMovieMetadata(movie) {
  const keywords = [
    movie.title,
    "watch online",
    "book tickets",
    ...(movie.genres ?? []),
    SITE.name,
  ];

  return buildMetadata({
    title: `${movie.title} — Book Tickets`,
    description:
      movie.description.length > 155
        ? movie.description.slice(0, 152) + "…"
        : movie.description,
    canonicalUrl: `/movies/${movie.slug}`,
    ogImage: movie.posterUrl,
    ogImageAlt: `${movie.title} poster`,
    keywords,
  });
}

export function generateShowMetadata(show) {
  const date = new Date(show.startsAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return buildMetadata({
    title: `${show.movieTitle} at ${show.cinemaName} — ${formattedDate}`,
    description: `Book seats for ${show.movieTitle} showing at ${show.cinemaName} (${show.hallName}) on ${formattedDate} at ${formattedTime}. Fast & secure ticket booking.`,
    canonicalUrl: `/shows/${show.id}`,
    noindex: show.isExpired ?? false,
    keywords: [
      show.movieTitle,
      show.cinemaName,
      "showtimes",
      formattedDate,
      "book tickets",
    ],
  });
}

export function generateCinemaMetadata(cinema) {
  return buildMetadata({
    title: `${cinema.name} — Showtimes & Tickets in ${cinema.city}`,
    description:
      cinema.description ??
      `Browse all current showtimes at ${cinema.name} in ${cinema.city}. Book your seats online in seconds.`,
    canonicalUrl: `/cinemas/${cinema.slug}`,
    ogImage: cinema.coverImageUrl,
    ogImageAlt: `${cinema.name} cinema`,
    keywords: [
      cinema.name,
      cinema.city,
      "cinema",
      "movie theater",
      "showtimes",
      "book tickets",
    ],
  });
}

export function generateSearchMetadata(data) {
  const { query, resultCount = 0 } = data;
  const hasQuery = Boolean(query?.trim());

  return buildMetadata({
    title: hasQuery ? `Search results for "${query}"` : "Search Movies & Cinemas",
    description: hasQuery
      ? `Found ${resultCount} result${resultCount !== 1 ? "s" : ""} for "${query}" on ${SITE.name}. Browse movies, showtimes, and cinemas.`
      : `Search for movies, showtimes, and cinemas on ${SITE.name}.`,
    canonicalUrl: hasQuery ? `/search?q=${encodeURIComponent(query)}` : "/search",
    noindex: true,
  });
}
