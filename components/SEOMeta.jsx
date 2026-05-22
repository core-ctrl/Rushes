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
      : `${title} | ${siteName}`
    : 'Rushes — Where movie people connect';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in';
  const fullUrl = `${baseUrl}${url || ''}`;
  const defaultImage = `${baseUrl}/og-default.png`;
  const metaImage = image || defaultImage;
  const metaDescription =
    description ||
    'Discover, discuss and share movies and series with people who feel cinema like you do.';

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* PWA */}
      <meta name="theme-color" content="#E63946" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Head>
  );
}
