/**
 * lib/news/url-hash.js
 *
 * URL normalization + hashing for article dedup.
 *
 * The same article often reaches us via multiple URLs:
 *   - RSS feed gives  https://site.com/article?utm_source=feedburner
 *   - Social share   https://site.com/article?ref=twitter
 *   - Canonical      https://site.com/article/
 *
 * We normalize aggressively (strip tracking params, trailing slashes, etc.)
 * then SHA-256 the result. url_hash has a unique constraint in Postgres so
 * duplicates get rejected at insert time.
 *
 * This only handles the exact-URL case. Semantic dedup (rewrites of the same
 * story across publications) arrives in Phase 2 alongside embeddings.
 */

import crypto from 'crypto';

const TRACKING_PARAMS = new Set([
  // Standard UTM
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_name', 'utm_reader', 'utm_viz_id', 'utm_pubreferrer',
  // Network-specific
  'fbclid', 'gclid', 'dclid', 'msclkid', 'yclid', 'twclid',
  'mc_cid', 'mc_eid',
  '_hsenc', '_hsmi', 'hsCtaTracking',
  'vero_conv', 'vero_id',
  'igshid',
  // Generic referrer junk
  'ref', 'referrer', 'referer', 'source', 'src',
  'feed_id', 'feed', 'feedName', 'feedType',
]);

/**
 * Normalize a URL into its canonical form for dedup purposes.
 * Throws on genuinely unparseable input — callers should catch.
 */
export function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error(`Invalid URL: ${raw}`);
  }

  const url = new URL(raw.trim());

  // Lowercase scheme and host
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  // Drop default ports
  if ((url.protocol === 'https:' && url.port === '443') ||
      (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }

  // Strip www. — treat www.site.com and site.com as the same article
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
  }

  // Drop fragments — #section anchors don't identify a different article
  url.hash = '';

  // Remove tracking params, sort the rest for stable ordering
  const params = [...url.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  url.search = '';
  for (const [k, v] of params) url.searchParams.append(k, v);

  // Normalize trailing slash on path (but not on root)
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  url.pathname = pathname;

  return url.toString();
}

/**
 * Hash a URL to a 64-char hex string suitable for the url_hash column.
 */
export function hashUrl(raw) {
  const normalized = normalizeUrl(raw);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
