import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weddinglivestreaming.com';

// AI crawlers are customers now — explicitly allow the ones that power AI
// search / answer engines (ChatGPT search, Perplexity, Claude, Google's AI
// features, Bing/Copilot) in addition to the default rule for everyone else.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/admin/', '/auth/', '/api/'] },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/auth/', '/api/'],
      })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
