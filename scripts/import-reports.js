/**
 * EP Investing — Report PDF Importer
 *
 * Uploads PDF files to Supabase Storage and inserts records into the reports table.
 *
 * Usage:
 *   node scripts/import-reports.js           # import all reports defined below
 *   NODE_ENV=dry node scripts/import-reports.js   # dry run (no DB/storage changes)
 *
 * Before running:
 *   1. Place PDF files in scripts/reports/ folder
 *   2. Filenames must match the `pdfFile` field in REPORTS below
 */

import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

// ─── Load env ────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = existsSync(resolve(root, '.env.local'))
  ? resolve(root, '.env.local') : resolve(root, '.env');

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.env.NODE_ENV === 'dry';
const REPORTS_DIR = resolve(__dirname, 'reports');
const STORAGE_BUCKET = 'reports';

// ─── Report definitions ───────────────────────────────────────────────────────
const REPORTS = [
  {
    pdfFile: "Photovoltaic Market Analysis_ India's Renewable Energy_ An In-depth Study of India's Solar PV Sector.pdf",
    slug: 'india-pv-manufacturing-analysis',
    title: 'PV Manufacturing Facilities in India',
    subtitle: "An In-depth Study of India's Solar PV Sector, Investment Patterns, and Market Dynamics",
    sector: 'solar',
    geography: 'India',
    summary: "Comprehensive analysis of India's photovoltaic manufacturing landscape, covering investment trends, domestic players like Waaree Energies and Adani Solar, supply chain challenges, government policy, and projections toward 292 GW of solar capacity by 2030.",
    market_value: '$5B FDI (2023)',
    expected_growth: '292 GW by 2030',
    published: true,
    published_at: '2025-04-01',
    linked_company_tags: ['solar'],
    key_findings: [
      "India's solar capacity projected to reach 292 GW by 2030",
      "83% of power sector investment directed toward clean energy in 2024",
      "India received $2.4B in DFI funding for clean energy in 2024 — largest globally",
      "FDI in energy reached $5B in 2023, nearly double pre-pandemic levels",
      "Top exporters Waaree, Adani Solar, and Vikram Solar ship 50%+ of output abroad",
      "India still relies on China for 50%+ of PV cell and module components",
    ],
  },
  {
    pdfFile: 'Kenya_Clean_Cooking_Market_Analysis.pdf',
    slug: 'kenya-clean-cooking-analysis',
    title: 'Clean Cooking Industry in Kenya',
    subtitle: 'Comprehensive Market Analysis: The Clean Cooking Sector in Kenya',
    sector: 'clean_cooking',
    geography: 'Kenya',
    summary: "In-depth analysis of Kenya's clean cooking sector covering market segmentation, the Kenya National Cooking Transition Strategy (2024–2028), key private sector players, carbon finance challenges, and investment needs. Kenya aims for universal clean cooking access by 2028, with 68.5% of households still relying on traditional biomass as of 2023.",
    market_value: '8.5M+ underserved households',
    expected_growth: 'Universal access target by 2028',
    published: true,
    published_at: '2025-06-01',
    linked_company_tags: ['clean_cooking', 'carbon_credits'],
    key_findings: [
      '68.5% of Kenyan households still rely on traditional biomass fuels as of 2023',
      'Urban clean cooking access at 76% vs only 12% in rural areas',
      'Kenya National Cooking Transition Strategy targets universal access by 2028',
      'Carbon credit over-crediting crisis — average 9.2x over-credited globally; Gold Standard Metered methodology reduces this to ~1.5x',
      'Burn Manufacturing has sold over 2 million units and leads on carbon credit integrity',
      'KOKO Networks operates 700+ ethanol fuel-ATM stations across urban Kenya',
      'Annual public investment needed: ~10 million per year',
    ],
  },
  {
    pdfFile: 'Electric Vehicle Market in Argentina PDF.pdf',
    slug: 'argentina-ev-analysis',
    title: 'EV Industry in Argentina',
    subtitle: "The Electric Vehicle Market in Argentina: Market Analysis",
    sector: 'ev_charging',
    geography: 'Argentina',
    summary: "Comprehensive analysis of Argentina's EV market at a strategic inflection point in 2025. Covers charging infrastructure players like Chargebox Net and YPF, domestic manufacturers like Tito and ÁSTOR, the surge of Chinese OEM imports following 2024 tariff cuts, and lessons from Brazil and Mexico for scaling electromobility.",
    market_value: '14,175 electrified vehicles sold (2024)',
    expected_growth: '12% EV market share by 2034',
    published: true,
    published_at: '2025-06-01',
    linked_company_tags: ['ev_charging'],
    key_findings: [
      '9,552 electrified vehicles sold in first 4 months of 2025 — 14.1% market share',
      'BEVs up 51.7% YoY, PHEVs up 65.7%, HEVs up 30.1%',
      'Argentina holds second-largest lithium reserves globally (~20 Mt)',
      '2024 tariff cuts opened market to BYD, MG, Chery with 0% duty on EVs under $16k',
      'Chargebox Net leads charging with 120 installed, 250+ locations secured',
      'Buenos Aires launched first all-electric bus line serving 500,000+ riders/year',
      'No national electromobility law — legal vacuum prevents per-kWh energy billing',
    ],
  },
  {
    pdfFile: 'Colombian Solar Industry Analysis.pdf',
    slug: 'colombian-solar-industry-analysis',
    title: 'Solar PV Market in Colombia',
    subtitle: 'The Colombian Solar Market: Current Landscape, Challenges, and Future Outlook',
    sector: 'solar',
    geography: 'Colombia',
    summary: "Analysis of Colombia's rapidly growing solar sector, covering key players like Atlas Renewable Energy, Enel Green Power, and Celsia, regulatory frameworks including Laws 1715 and 2099, investment trends, and the challenges of permitting delays and grid expansion needed to meet the national 6 GW target by 2026.",
    market_value: '2 GW installed capacity (early 2025)',
    expected_growth: '6 GW target by 2026',
    published: true,
    published_at: '2025-06-01',
    linked_company_tags: ['solar'],
    key_findings: [
      'Solar capacity surpassed 2 GW in early 2025 — about 10% of the national renewable mix',
      'February 2024 reliability auction awarded 4.4 GW of new solar projects',
      'IRR for solar ranges from 25% residential to 60% industrial due to high energy costs',
      'Atlas Renewable Energy 201 MW Shangri-La project financed via $113M IDB/Bancolombia loan',
      'Enel Colombia leads with 688 MW solar and 1.2 GW won in 2024 auction',
      'Only 5 of 220 grid connection applications approved recently — permitting is a critical bottleneck',
      'Celsia commissioned Colombia first solar+storage system (1 MW/2 MWh BESS) in December 2024',
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📄 EP Investing — Report Importer${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Ensure storage bucket exists
  if (!DRY_RUN) {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
      if (error) {
        console.error(`❌ Could not create storage bucket: ${error.message}`);
        process.exit(1);
      }
      console.log(`✅ Created storage bucket: ${STORAGE_BUCKET}\n`);
    }
  }

  let added = 0, skipped = 0, failed = 0;

  for (const report of REPORTS) {
    const pdfPath = resolve(REPORTS_DIR, report.pdfFile);

    console.log(`\n📂 ${report.title}`);

    // Check if PDF file exists
    if (!existsSync(pdfPath)) {
      console.log(`  ⚠ PDF not found: scripts/reports/${report.pdfFile} — skipping`);
      skipped++;
      continue;
    }

    // Check if report already exists
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('slug', report.slug)
      .single();

    if (existing) {
      console.log(`  ⏭  Already in DB (slug: ${report.slug})`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ✓ Would upload: ${report.pdfFile}`);
      console.log(`  ✓ Would insert: ${report.slug}`);
      added++;
      continue;
    }

    // Upload PDF to Supabase Storage
    console.log(`  ⬆ Uploading PDF...`);
    const pdfBuffer = readFileSync(pdfPath);
    const storagePath = `${report.slug}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.log(`  ✗ Upload failed: ${uploadError.message}`);
      failed++;
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const pdf_url = urlData.publicUrl;
    console.log(`  ✓ Uploaded: ${pdf_url}`);

    // Insert report record
    const { error: insertError } = await supabase.from('reports').insert({
      slug: report.slug,
      title: report.title,
      subtitle: report.subtitle,
      sector: report.sector,
      geography: report.geography,
      summary: report.summary,
      pdf_url,
      market_value: report.market_value,
      expected_growth: report.expected_growth,
      published: report.published,
      published_at: report.published_at,
      linked_company_tags: report.linked_company_tags,
      key_findings: report.key_findings,
    });

    if (insertError) {
      console.log(`  ✗ DB insert failed: ${insertError.message}`);
      failed++;
    } else {
      console.log(`  ✓ Inserted report: ${report.slug}`);
      added++;
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Added:   ${added}`);
  console.log(`⏭  Skipped: ${skipped}`);
  console.log(`✗  Failed:  ${failed}`);
  if (DRY_RUN) console.log('\n(Dry run — no changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
