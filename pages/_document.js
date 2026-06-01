import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />


      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
