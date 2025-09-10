// next-sitemap.config.js
export default {
    siteUrl: 'http://localhost:3000',
    generateRobotsTxt: true,
    changefreq: 'daily',
    priority: 0.7,
    sitemapSize: 5000,
    exclude: [
      '/admin',
      '/api/*',
      '/404',
      '/500',
      '/_*',
      '/static/*'
    ],
    alternateRefs: [
      {
        href: 'http://localhost:3000/en',
        hreflang: 'en'
      },
      {
        href: 'http://localhost:3000/vi',
        hreflang: 'vi'
      }
    ],
    robotsTxtOptions: {
      policies: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/api/*']
        }
      ]
    }
};
  