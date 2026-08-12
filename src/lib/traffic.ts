/**
 * Traffic classification for the first-party pageview log (migration 0015).
 *
 * Everything here has to run on the Edge runtime inside middleware, so: no Node
 * APIs, no dependencies, and nothing that allocates per-request beyond the
 * obvious. Regexes are module-level constants so they compile once per isolate
 * rather than once per request.
 */

/**
 * Crawlers that feed an AI answer engine, mapped to the name we store.
 *
 * This is the list that matters for the AEO work. Two different jobs are mixed
 * in here on purpose:
 *   - Index builders (GPTBot, ClaudeBot, Google-Extended, CCBot) — these decide
 *     whether we're in the training/retrieval corpus at all.
 *   - Live fetchers (ChatGPT-User, Perplexity-User, Claude-User) — these fire
 *     when a real person's question caused the assistant to open our page right
 *     then. A hit from one of these is the closest thing to proof that the AEO
 *     work is reaching an actual human.
 * Order matters: more specific tokens are tested first so ChatGPT-User isn't
 * swallowed by a looser GPT match.
 */
const AI_CRAWLERS: Array<[RegExp, string]> = [
  [/OAI-SearchBot/i,     'OAI-SearchBot'],
  [/ChatGPT-User/i,      'ChatGPT-User'],
  [/GPTBot/i,            'GPTBot'],
  [/Perplexity-User/i,   'Perplexity-User'],
  [/PerplexityBot/i,     'PerplexityBot'],
  [/Claude-SearchBot/i,  'Claude-SearchBot'],
  [/Claude-User/i,       'Claude-User'],
  [/ClaudeBot/i,         'ClaudeBot'],
  [/anthropic-ai/i,      'anthropic-ai'],
  [/Google-Extended/i,   'Google-Extended'],
  [/Applebot-Extended/i, 'Applebot-Extended'],
  [/meta-externalagent/i,'meta-externalagent'],
  [/Bytespider/i,        'Bytespider'],
  [/Amazonbot/i,         'Amazonbot'],
  [/DuckAssistBot/i,     'DuckAssistBot'],
  [/cohere-ai/i,         'cohere-ai'],
  [/CCBot/i,             'CCBot'],
  [/YouBot/i,            'YouBot'],
  [/Diffbot/i,           'Diffbot'],
];

/**
 * Ordinary bots. Googlebot and bingbot live here rather than in AI_CRAWLERS
 * because they're classic index crawlers — but they're still worth logging,
 * since bingbot activity is the leading indicator for ChatGPT visibility
 * (ChatGPT's search grounding runs on the Bing index).
 */
const GENERIC_BOT =
  /bot\b|crawler|spider|crawling|slurp|facebookexternalhit|WhatsApp|Slackbot|TelegramBot|Discordbot|LinkedInBot|Twitterbot|Pinterest|SemrushBot|AhrefsBot|MJ12bot|DotBot|PetalBot|DataForSeo|Screaming Frog|curl\/|wget|python-requests|axios\/|node-fetch|Go-http-client|headless|Lighthouse|PTST|monitoring|uptime|pingdom|StatusCake|vercel-screenshot|Better Uptime/i;

/** Referrer hosts that mean "a person clicked through from an AI assistant". */
const AI_REFERRER =
  /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|claude\.ai|anthropic\.com|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|you\.com|poe\.com|grok\.com|x\.ai|mistral\.ai|chat\.deepseek\.com|phind\.com|kagi\.com)$/i;

const SEARCH_REFERRER =
  /(^|\.)(google\.[a-z.]{2,6}|bing\.com|duckduckgo\.com|search\.yahoo\.com|yahoo\.com|ecosia\.org|search\.brave\.com|yandex\.[a-z]{2,3}|baidu\.com|startpage\.com|search\.marcia\.com|lite\.duckduckgo\.com|qwant\.com|ask\.com|aol\.com)$/i;

const SOCIAL_REFERRER =
  /(^|\.)(facebook\.com|m\.facebook\.com|l\.facebook\.com|instagram\.com|pinterest\.[a-z.]{2,6}|reddit\.com|out\.reddit\.com|tiktok\.com|x\.com|twitter\.com|t\.co|linkedin\.com|lnkd\.in|youtube\.com|threads\.net|nextdoor\.com)$/i;

export type TrafficSource =
  | 'direct'
  | 'organic'
  | 'ai_assistant'
  | 'social'
  | 'referral'
  | 'internal';

/** Which AI crawler this is, or null if the UA isn't one. */
export function detectAiCrawler(userAgent: string): string | null {
  for (const [pattern, name] of AI_CRAWLERS) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

export function isBot(userAgent: string): boolean {
  if (!userAgent) return true; // no UA at all is never a real browser
  return GENERIC_BOT.test(userAgent) || detectAiCrawler(userAgent) !== null;
}

/**
 * Bucket a referrer. `selfHost` is passed in so internal navigation doesn't
 * masquerade as a referral and inflate the numbers.
 */
export function classifyReferrer(
  referrerHost: string | null,
  selfHost: string
): TrafficSource {
  if (!referrerHost) return 'direct';

  const host = referrerHost.toLowerCase().replace(/^www\./, '');
  const self = selfHost.toLowerCase().replace(/^www\./, '');
  if (host === self) return 'internal';

  // AI first: gemini.google.com would otherwise be caught by the Google search
  // pattern and quietly mis-filed as organic, hiding the exact signal we built
  // this table to see.
  if (AI_REFERRER.test(host)) return 'ai_assistant';
  if (SEARCH_REFERRER.test(host)) return 'organic';
  if (SOCIAL_REFERRER.test(host)) return 'social';
  return 'referral';
}

/** Coarse device bucket. Deliberately three values — enough to spot a mobile UX problem, not fingerprinting. */
export function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(userAgent)) return 'tablet';
  if (/Mobile|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

/**
 * Daily-rotating, non-reversible visitor id.
 *
 * The UTC date inside the digest is what makes this privacy-safe: the same
 * person gets a different hash tomorrow, so the table can answer "how many
 * distinct people today" without being able to answer "what else did this
 * person read last week". The salt keeps it from being brute-forced from the
 * stored value — the IPv4 space is small enough to enumerate without one.
 */
export async function visitorHash(
  ip: string,
  userAgent: string,
  salt: string,
  date = new Date()
): Promise<string> {
  const day = date.toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${day}|${ip}|${userAgent}|${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Human-facing labels for the admin dashboard. */
export const SOURCE_LABELS: Record<TrafficSource, string> = {
  organic: 'Search engines',
  ai_assistant: 'AI assistants',
  direct: 'Direct / typed in',
  social: 'Social',
  referral: 'Other sites',
  internal: 'Internal',
};
