import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weddinglivestreaming.com';

// AI crawlers are customers now — explicitly allow the ones that power AI
// search / answer engines (ChatGPT search, Perplexity, Claude, Google's AI
// features, Bing/Copilot) in addition to the default rule for everyone else.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot'];

// Crawlers that send no humans and were burning the free tier: in the 25 days
// to 2026-09-05, meta-externalagent alone hit the site 234,741 times (65k/day
// at peak) — 95% of all requests — against ~80 organic human visits. None of
// these feed a search engine or an answer engine that cites sources:
//   meta-externalagent  Meta's AI-training crawler (Meta AI's live answers use
//                       Bing/Google results, and link previews use the separate
//                       facebookexternalhit agent — both still allowed)
//   Bytespider          ByteDance/TikTok training crawler
//   Amazonbot           Alexa; 1,787 hits, zero referrals
// All three document that they honor robots.txt. Revisit if any of them ever
// starts sending traffic (source='ai_assistant' in /admin/traffic).
const BLOCKED_CRAWLERS = ['meta-externalagent', 'Bytespider', 'Amazonbot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/admin/', '/auth/', '/api/'] },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/auth/', '/api/'],
      })),
      ...BLOCKED_CRAWLERS.map((userAgent) => ({ userAgent, disallow: '/' })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
