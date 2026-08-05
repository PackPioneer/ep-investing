/**
 * seed-public-tickers.mjs
 * Seeds the "EP Climate basket" — a curated set of US-listed climate/energy
 * public companies — into market_quotes (prices filled later by the fetcher).
 * Run market_quotes CREATE TABLE first, then this, then fetch-market-quotes.mjs.
 *   node --env-file=.env.local seed-public-tickers.mjs
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BASKET = [
  ['FSLR','First Solar','solar'], ['RUN','Sunrun','solar'], ['ENPH','Enphase','solar'], ['SEDG','SolarEdge','solar'],
  ['NOVA','Sunnova','solar'], ['ARRY','Array Technologies','solar'], ['SHLS','Shoals','solar'], ['CSIQ','Canadian Solar','solar'],
  ['NXT','Nextracker','solar'], ['MAXN','Maxeon','solar'],
  ['QS','QuantumScape','battery_storage'], ['FLNC','Fluence','grid_storage'], ['STEM','Stem','grid_storage'], ['AMPX','Amprius','battery_storage'],
  ['PLUG','Plug Power','green_hydrogen'], ['BE','Bloom Energy','green_hydrogen'], ['BLDP','Ballard','green_hydrogen'],
  ['RIVN','Rivian','ev_charging'], ['LCID','Lucid','ev_charging'], ['CHPT','ChargePoint','ev_charging'], ['EVGO','EVgo','ev_charging'], ['BLNK','Blink','ev_charging'],
  ['SMR','NuScale Power','nuclear_technologies'], ['OKLO','Oklo','nuclear_technologies'], ['LEU','Centrus Energy','nuclear_technologies'], ['CEG','Constellation Energy','nuclear_technologies'],
  ['GEV','GE Vernova','energy_generation'], ['NEE','NextEra Energy','energy_generation'], ['BEP','Brookfield Renewable','energy_generation'], ['CWEN','Clearway Energy','energy_generation'], ['AES','AES','energy_generation'],
];

async function main() {
  const rows = BASKET.map(([ticker, name, sector]) => ({ ticker, name, sector }));
  const { error } = await supabase.from('market_quotes').upsert(rows, { onConflict: 'ticker' });
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Seeded ${rows.length} tickers into market_quotes. Now run fetch-market-quotes.mjs to fill prices.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
