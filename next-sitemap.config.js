/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://clubs4community.app',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/student/dashboard/', '/teacher/dashboard/', '/api/'],
      },
    ],
    additionalSitemaps: [
      'https://clubs4community.app/sitemap.xml',
    ],
  },
  exclude: [
    '/admin/*',
    '/student/dashboard/*',
    '/teacher/dashboard/*',
    '/api/*',
    '/_next/*',
    '/404',
    '/500',
  ],
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  trailingSlash: false,
  transform: async (config, path) => {
    // Ensure all URLs use HTTPS
    return {
      loc: path.replace(/^http:/, 'https:'),
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  },
} 