/**
 * lib/news/embeddings.js
 *
 * Generates OpenAI embeddings for articles and users. Isolated from the
 * Anthropic enrichment code since it's a different vendor and different
 * data access pattern (batched, cheap, high-volume).
 *
 * Uses text-embedding-3-small (1536 dimensions, matches the pgvector
 * column size we defined in Phase 1).
 */

import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMS = 1536;

// OpenAI accepts arrays for batch embedding. Keep batch size conservative
// to stay well under the 8k-token input cap per request.
const BATCH_SIZE = 50;

// Per-text character cap before we send to OpenAI. Article summaries rarely
// exceed 500 chars; 2000 gives plenty of headroom for titles + summaries
// combined without burning tokens on noise.
const MAX_TEXT_CHARS = 2000;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  _client = new OpenAI({ apiKey });
  return _client;
}

function truncate(text, max = MAX_TEXT_CHARS) {
  if (!text) return '';
  const s = String(text).trim();
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Build the text we embed for an article. Title + factual summary gives
 * the model enough signal without the noise of full body text.
 *
 * Source and classification are included as weak signals for clustering —
 * two articles from the same source about the same topic will land closer
 * in embedding space, which is what we want for recommendations.
 */
export function buildArticleEmbeddingText(article) {
  const parts = [];
  if (article.title) parts.push(article.title);
  if (article.summary_factual) parts.push(article.summary_factual);
  else if (article.excerpt) parts.push(article.excerpt);
  if (article.classification && article.classification !== 'other') {
    parts.push(`Type: ${article.classification}`);
  }
  if (article.sector_tags?.length) {
    parts.push(`Sectors: ${article.sector_tags.slice(0, 5).join(', ')}`);
  }
  if (article.geography_tags?.length) {
    parts.push(`Regions: ${article.geography_tags.slice(0, 5).join(', ')}`);
  }
  return truncate(parts.join('\n\n'));
}

/**
 * Build the text we embed for a user. Profile fields only (per Phase 3B
 * design decision). If the user has no meaningful prefs set, returns null
 * and the caller should skip embedding generation for them.
 */
export function buildUserEmbeddingText(prefs) {
  if (!prefs) return null;
  const parts = [];
  if (prefs.sectors?.length) parts.push(`Interested sectors: ${prefs.sectors.join(', ')}`);
  if (prefs.geographies?.length) parts.push(`Focus regions: ${prefs.geographies.join(', ')}`);
  // user_news_preferences doesn't have a thesis column by default; if the
  // investor profile table has one, the cron job joins it in before calling
  // this function. Same for focus, check_size, etc.
  if (prefs.thesis) parts.push(`Thesis: ${prefs.thesis}`);
  if (prefs.focus) parts.push(`Focus areas: ${prefs.focus}`);

  const text = truncate(parts.join('\n\n'));
  return text.length >= 20 ? text : null;
}

/**
 * Generate embeddings for an array of texts. Returns an array of
 * number[] vectors in the same order as input. OpenAI's batch endpoint
 * is much cheaper than one-at-a-time calls.
 */
export async function embedTexts(texts) {
  if (!texts || texts.length === 0) return [];
  const client = getClient();

  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map((t) => truncate(t));
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of response.data) {
      if (item.embedding.length !== EMBEDDING_DIMS) {
        throw new Error(
          `Unexpected embedding dimension: ${item.embedding.length}, expected ${EMBEDDING_DIMS}`
        );
      }
      results.push(item.embedding);
    }
  }
  return results;
}

/**
 * Convenience: embed a single text. Returns a number[] vector or null if
 * the input is empty.
 */
export async function embedText(text) {
  if (!text || !text.trim()) return null;
  const [vec] = await embedTexts([text]);
  return vec ?? null;
}
