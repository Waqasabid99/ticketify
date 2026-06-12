/**
 * jsonLd.ts
 * ─────────────────────────────────────────────
 * Schema.org JSON-LD generators for Ticketify pages.
 *
 * How to use in a page:
 *   import { MovieJsonLd } from "@/lib/seo/jsonLd";
 *
 *   export default function MoviePage({ movie }) {
 *     return (
 *       <>
 *         <MovieJsonLd movie={movie} />
 *         ...rest of page
 *       </>
 *     );
 *   }
 */

import { SITE } from "./seo.config";

// ─── Helper ──────────────────────────────────────────────────────────────────

function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Movie page ───────────────────────────────────────────────────────────────
// Schema: https://schema.org/Movie

export function MovieJsonLd({ movie }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description,
    url: `${SITE.url}/movies/${movie.slug}`,
    ...(movie.posterUrl && { image: movie.posterUrl }),
    ...(movie.releaseDate && { datePublished: movie.releaseDate }),
    ...(movie.durationMinutes && {
      duration: `PT${movie.durationMinutes}M`,
    }),
    ...(movie.genres?.length && { genre: movie.genres }),
    ...(movie.rating && {
      contentRating: movie.rating,
    }),
    ...(movie.cast?.length && {
      actor: movie.cast.map((c) => ({
        "@type": "Person",
        name: c.name,
        ...(c.character && { characterName: c.character }),
      })),
    }),
    ...(movie.directors?.length && {
      director: movie.directors.map((d) => ({ "@type": "Person", name: d })),
    }),
  };

  return <JsonLd data={data} />;
}

// ─── Show / Screening page ────────────────────────────────────────────────────
// Schema: https://schema.org/ScreeningEvent

export function ShowJsonLd({ show }) {
  const availability = show.isExpired
    ? "https://schema.org/Discontinued"
    : "https://schema.org/InStock";

  const data = {
    "@context": "https://schema.org",
    "@type": "ScreeningEvent",
    name: `${show.movieTitle} at ${show.cinemaName}`,
    url: `${SITE.url}/shows/${show.id}`,
    startDate: new Date(show.startsAt).toISOString(),
    ...(show.endsAt && { endDate: new Date(show.endsAt).toISOString() }),
    location: {
      "@type": "MovieTheater",
      name: show.cinemaName,
      address: {
        "@type": "PostalAddress",
        streetAddress: show.cinemaAddress,
        addressLocality: show.cinemaCity,
      },
      url: `${SITE.url}/cinemas/${show.cinemaSlug}`,
    },
    workPresented: {
      "@type": "Movie",
      name: show.movieTitle,
      url: `${SITE.url}/movies/${show.movieSlug}`,
      ...(show.moviePosterUrl && { image: show.moviePosterUrl }),
    },
    ...(show.ticketPriceMin != null && {
      offers: {
        "@type": "Offer",
        availability,
        url: `${SITE.url}/shows/${show.id}`,
        priceCurrency: show.currency ?? "USD",
        price: show.ticketPriceMin,
        ...(show.ticketPriceMax != null &&
          show.ticketPriceMax !== show.ticketPriceMin && {
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: show.ticketPriceMin,
            maxPrice: show.ticketPriceMax,
            priceCurrency: show.currency ?? "USD",
          },
        }),
      },
    }),
    organizer: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
  };

  return <JsonLd data={data} />;
}

// ─── Cinema / Venue page ──────────────────────────────────────────────────────
// Schema: https://schema.org/MovieTheater

export function CinemaJsonLd({ cinema }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "MovieTheater",
    name: cinema.name,
    description: cinema.description,
    url: `${SITE.url}/cinemas/${cinema.slug}`,
    ...(cinema.coverImageUrl && { image: cinema.coverImageUrl }),
    address: {
      "@type": "PostalAddress",
      streetAddress: cinema.address,
      addressLocality: cinema.city,
      ...(cinema.postalCode && { postalCode: cinema.postalCode }),
      ...(cinema.country && { addressCountry: cinema.country }),
    },
    ...(cinema.phone && { telephone: cinema.phone }),
    ...(cinema.latitude != null &&
      cinema.longitude != null && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: cinema.latitude,
        longitude: cinema.longitude,
      },
    }),
  };

  return <JsonLd data={data} />;
}

// ─── Breadcrumb (reusable across pages) ──────────────────────────────────────

export function BreadcrumbJsonLd({ items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE.url}${item.url}`,
    })),
  };

  return <JsonLd data={data} />;
}

// ─── Organization (put in root layout once) ───────────────────────────────────

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    sameAs: [],
  };

  return <JsonLd data={data} />;
}
