/**
 * /api/cron/auto-discover
 *
 * Called by Vercel cron every Monday at 3am.
 * Runs auto-discovery for 2 random categories per week
 * to gradually grow the database without hammering APIs.
 *
 * Protected by CRON_SECRET env var.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const CATEGORY_PROMPTS = {
  battery_storage:            'List 15 real funded startup companies working on battery storage, lithium-ion, solid-state batteries, or grid-scale energy storage. Include website URLs.',
  carbon_credits:             'List 15 real funded startup companies in voluntary carbon markets, carbon offsets, or carbon accounting software. Include website URLs.',
  clean_cooking:              'List 15 real companies making clean cookstoves or clean household energy for developing markets. Include website URLs.',
  direct_air_capture:         'List 15 real funded startup companies doing direct air capture or carbon dioxide removal. Include website URLs.',
  electric_aviation:          'List 15 real funded startup companies building electric aircraft, eVTOL, or zero-emission aviation. Include website URLs.',
  ev_charging:                'List 15 real funded startup companies building EV charging networks or smart charging software. Include website URLs.',
  geothermal_energy:          'List 15 real funded startup companies working on geothermal energy or enhanced geothermal systems. Include website URLs.',
  green_hydrogen:             'List 15 real funded startup companies producing green hydrogen or building electrolyzers. Include website URLs.',
  grid_storage:               'List 15 real funded startup companies working on long-duration grid storage or flow batteries. Include website URLs.',
  industrial_decarbonization: 'List 15 real funded startup companies decarbonizing heavy industry: green steel, cement, industrial heat. Include website URLs.',
  nuclear_technologies:       'List 15 real funded startup companies building advanced nuclear reactors, SMRs, or fusion energy. Include website URLs.',
  saf_efuels:                 'List 15 real funded startup companies producing sustainable aviation fuel or synthetic e-fuels. Include website URLs.',
  solar:                      'List 15 real funded startup companies in solar panels, solar installation software, or solar financing. Include website URLs.',
  wind_energy:                'List 15 real funded startup companies in wind turbines, offshore wind, or wind project development. Include website URLs.',
};

async function discoverForCategory(category) {
  const prompt = CATEGORY_PROMPTS[category];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `${prompt}

Return ONLY a JSON array, no markdown:
[{"name": "Company", "url": "https://company.com", "description": "One sentence"}, ...]`,
      }],
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await res.json();
  const textBlock = data?.content?.find(b => b.type === 'text');
  if (!textBlock?.text) return [];

  const cleaned = textBlock.text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]).filter(c => c.url && c.name);
  } catch {
    return [];
  }
}

export async function GET(req) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get existing hostnames
    const { data: existing } = await supabase.from('companies').select('url');
    const existingHostnames = new Set(
      (existing || []).map(c => {
        try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return null; }
      }).filter(Boolean)
    );

    // Pick 2 random categories this week
    const categories = Object.keys(CATEGORY_PROMPTS);
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const thisWeek = [
      categories[weekNumber % categories.length],
      categories[(weekNumber + 1) % categories.length],
    ];

    let added = 0;

    for (const category of thisWeek) {
      const discovered = await discoverForCategory(category);

      for (const company of discovered) {
        let hostname;
        try {
          hostname = new URL(company.url).hostname.replace(/^www\./, '');
        } catch { continue; }

        if (existingHostnames.has(hostname)) continue;

        // Get logo
        let logo_url = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
        try {
          const lr = await fetch(`https://logo.clearbit.com/${hostname}`, {
            method: 'HEAD', signal: AbortSignal.timeout(3000)
          });
          if (lr.ok) logo_url = `https://logo.clearbit.com/${hostname}`;
        } catch { /* use favicon */ }

        const { error } = await supabase.from('companies').insert({
          name: company.name,
          url: company.url,
          description: company.description?.slice(0, 500) || null,
          logo_url,
          industry_tags: [category],
          sector: 'cleantech_company',
          enrichment_provenance: 'cron_auto_discovery',
        });

        if (!error) {
          existingHostnames.add(hostname);
          added++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      categories: thisWeek,
      added,
    });
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
