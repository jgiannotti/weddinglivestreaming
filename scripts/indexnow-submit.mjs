// Submits every URL in the live sitemap to IndexNow (Bing, Seznam, Naver,
// Yandex — and therefore ChatGPT search, which runs on Bing's index).
//
//   node scripts/indexnow-submit.mjs
//
// Run after any deploy that adds or meaningfully changes pages. The key file
// public/f77e2a2052cc82cf1bd69aa479c71d1b.txt must be live on the site (it
// is — it ships with the app), which is how IndexNow verifies we own the host.
//
// This does NOT replace Bing Webmaster Tools (which also gives us query/click
// reporting), but it gets our URLs into Bing's crawl queue without an account.

const KEY = 'f77e2a2052cc82cf1bd69aa479c71d1b';
const HOST = 'www.weddinglivestreaming.com';
const SITEMAP = `https://${HOST}/sitemap.xml`;

const res = await fetch(SITEMAP, { headers: { 'user-agent': 'wls-indexnow-submit' } });
if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error('no URLs found in sitemap');
console.log(`Submitting ${urls.length} URLs from ${SITEMAP}`);

// IndexNow accepts up to 10,000 URLs per POST; we're nowhere near that.
const body = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
};

const submit = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`IndexNow response: ${submit.status} ${submit.statusText}`);
if (submit.status >= 400) {
  console.log(await submit.text());
  process.exit(1);
}
console.log('Done — URLs queued for Bing/IndexNow crawling.');
