// Where to send someone after sign-in or sign-up.
//
// The value arrives in the URL (?next=...), so anyone can craft it and mail it
// to a vendor. It must only ever point back into this site, otherwise our own
// sign-in page becomes the trusted-looking first hop of a phishing link.
//
// A prefix check ("starts with one slash") is not enough. Browsers and
// `new URL()` strip tabs and newlines before parsing and read "\" as "/", so
// all of these start with a single slash and still land on another site:
//
//     //evil.com      /\evil.com      /<tab>/evil.com      /<newline>/evil.com
//
// The reliable test is to resolve the value the way a browser would and
// compare origins, then hand back the parsed path rather than the raw text.
// The parsed path is checked a second time, because dot segments can collapse
// into a leading "//" ("/.//evil.com" parses to the path "//evil.com", which
// is another site the next time anything reads it).

const PROBE_ORIGIN = 'https://same-site.invalid';

export function safeNextPath(raw: unknown, fallback = '/dashboard'): string {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return fallback;
  // No path this site generates contains a backslash or a control character.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.startsWith('//') || new URL(path, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
