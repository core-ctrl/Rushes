/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in',
  generateRobotsTxt: false, // We already created a custom robots.txt
  sitemapSize: 7000,
  exclude: ['/admin*', '/test*'], // Exclude admin panels from Google
  // Automatically generate sitemaps for static pages
};
