import { DEFAULT_OG_IMAGE, SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME, absoluteUrl, formatDateIso } from "./site";

// ── New helpers for Rushes branding ──────────────────────────────────

export function buildSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Rushes',
    description: 'Where movie people connect',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildSeo({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords = [],
  noindex = false,
}) {
  const fullTitle = title?.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    canonical: absoluteUrl(path),
    image: absoluteUrl(image),
    type,
    keywords: Array.isArray(keywords) ? keywords.filter(Boolean).join(", ") : keywords,
    noindex,
  };
}

export function buildArticleSchema(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: [absoluteUrl(article.featuredImage || DEFAULT_OG_IMAGE)],
    datePublished: formatDateIso(article.publishedAt),
    dateModified: formatDateIso(article.updatedAt || article.publishedAt),
    author: {
      "@type": "Person",
      name: article.author?.name || SITE_AUTHOR.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/apple-touch-icon.png"),
      },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
  };
}

export function buildMovieSchema(movie, path, type = "Movie") {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: movie.title || movie.name,
    description: movie.overview,
    image: movie.poster_path ? `/tmdb-proxy/w780${movie.poster_path}` : undefined,
    datePublished: movie.release_date || movie.first_air_date,
    genre: movie.genres?.map((genre) => genre.name),
    aggregateRating:
      movie.vote_average > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(movie.vote_average).toFixed(1),
            bestRating: "10",
            ratingCount: movie.vote_count || 1,
          }
        : undefined,
    url: absoluteUrl(path),
  };
}
