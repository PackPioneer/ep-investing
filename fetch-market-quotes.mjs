/**
 * fetch-market-quotes.mjs
 * Pulls live price + % change + market cap for each ticker in market_quotes
 * from Finnhub, and updates the table. Needs FINNHUB_API_KEY in .env.local
 * (free key at finnhub.io). Free tier = 60 calls/min, so it paces itself.
 *   node --env-file=.env.local fetch-market-quotes.mjs
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const KEY = process.env.FINNHUB_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!KEY) { console.error('Missing FINNHUB_API_KEY. Get a free key at finnhub.io and add it to .env.local.'); process.exit(1); }
  const { data: rows, error } = await supabase.from('market_quotes').select('ticker');
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Fetching quotes for ${rows.length} tickers...`);

  let ok = 0;
  for (const { ticker } of rows) {
    try {
      const q = await (await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${KEY}`)).json();
      const p = await (await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${KEY}`)).json();
      if (q && q.c) {
        await supabase.from('market_quotes').update({
          price: q.c, change_pct: q.dp ?? null,
          market_cap: p?.marketCapitalization ? Math.round(p.marketCapitalization) : null,
          updated_at: new Date().toISOString(),
        }).eq('ticker', ticker);
        ok++;
        process.stdout.write(`\r  ${ok}/${rows.length}  ${ticker} $${q.c} (${q.dp?.toFixed(1)}%)   `);
      }
    } catch (e) { /* skip */ }
    await sleep(2200); // stay under 60 calls/min (2 calls per ticker)
  }
  console.log(`\nDONE. Updated ${ok}/${rows.length} quotes.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
