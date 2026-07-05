import Head from 'next/head';

export default function SEOMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords = [],
  jsonLd,
  noindex = false,
}) {
  const siteName = 'Rushes';
  const fullTitle = title
    ? title.includes(siteName)
      ? title
      : `${title} | ${siteName} - The Ultimate Movie Finder`
    : 'Rushes — The Social Movie Finder & Tracker';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in';
  const fullUrl = `${baseUrl}${url || ''}`;
  const defaultImage = `${baseUrl}/og-default.png`;
  const metaImage = image || defaultImage;
  const metaDescription =
    description ||
    'Rushes is a social movie finder and tracker. Discover movies, read reviews, and connect with people. (Note: Rushes is a social platform for tracking and discussion, we do NOT host streaming links or pirated content).';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta
        name="robots"
        content={noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}
      />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:site" content="@rushesapp" />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}

      {/* PWA */}
      <meta name="theme-color" content="#E63946" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Head>
  );
}
