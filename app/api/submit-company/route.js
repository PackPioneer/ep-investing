/**
 * /api/submit-company
 *
 * Accepts user-submitted companies, validates them,
 * scrapes basic info, and adds to Supabase with status='pending'
 * for admin review before going live.
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import { NextResponse } from 'next/server';

// Clients initialized inside handler

const VALID_TAGS = [
  'battery_storage', 'carbon_credits', 'clean_cooking', 'direct_air_capture',
  'electric_aviation', 'ev_charging', 'geothermal_energy', 'green_hydrogen',
  'grid_storage', 'industrial_decarbonization', 'nuclear_technologies',
  'saf_efuels', 'solar', 'wind_energy',
];

async function scrapeUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EPInvestingBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};

    const html = await res.text();
    const root = parse(html);
    const getMeta = (prop) => {
      const el = root.querySelector(`meta[property="${prop}"]`) ||
                 root.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute('content')?.trim() || null;
    };

    const rawTitle = getMeta('og:site_name') || getMeta('og:title') ||
      root.querySelector('title')?.text?.trim() || '';
    const name = rawTitle.split(/[|\-–—]/)[0].trim().slice(0, 100);
    const description = getMeta('og:description') || getMeta('description') || '';

    const domain = new URL(url).hostname;
    let logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    try {
      const lr = await fetch(`https://logo.clearbit.com/${domain}`, {
        method: 'HEAD', signal: AbortSignal.timeout(3000)
      });
      if (lr.ok) logo_url = `https://logo.clearbit.com/${domain}`;
    } catch { /* use favicon */ }

    return { name, description, logo_url };
  } catch {
    return {};
  }
}

async function classifyWithClaude(name, description) {
  if (!ANTHROPIC_KEY) return ['industrial_decarbonization'];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Classify this climate company into 1-3 tags from this list only:
${VALID_TAGS.join(', ')}

Company: ${name}
Description: ${description}

Reply with ONLY a JSON array, e.g. ["solar", "battery_storage"]`,
        }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || '[]';
    const cleaned = text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
    const tags = JSON.parse(cleaned);
    return tags.filter(t => VALID_TAGS.includes(t));
  } catch {
    return ['industrial_decarbonization'];
  }
}

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  try {
    const body = await req.json();
    const { url, name: submittedName, description: submittedDesc, submitter_email } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let normalizedUrl;
    try {
      normalizedUrl = new URL(url.startsWith('http') ? url : `https://${url}`).href;
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, '');

    // Check if already exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('url', `%${hostname}%`)
      .limit(1);

    if (existing?.length > 0) {
      return NextResponse.json({
        error: 'This company is already in our database',
        existing: existing[0].name,
      }, { status: 409 });
    }

    // Scrape the URL for info
    const scraped = await scrapeUrl(normalizedUrl);
    const name = submittedName || scraped.name || hostname;
    const description = submittedDesc || scraped.description || '';

    // Classify
    const tags = await classifyWithClaude(name, description);

    // Insert with pending status for admin review
    const { data: inserted, error } = await supabase
      .from('companies')
      .insert({
        name,
        url: normalizedUrl,
        description: description.slice(0, 500),
        logo_url: scraped.logo_url || null,
        industry_tags: tags,
        sector: 'cleantech_company',
        enrichment_provenance: `user_submission:${submitter_email || 'anonymous'}`,
        // Add a pending flag — you'll need to add this column or use an existing one
        // If you don't have a status column, remove this line
        // status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: 'Failed to save company' }, { status: 500 });
    }

    // Send admin notification email via Resend
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'EP Investment <otto@epinvesting.com>',
          to: 'otto@epinvesting.com',
          subject: `New company submitted: ${name}`,
          html: `
            <h2>New Company Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>URL:</strong> <a href="${normalizedUrl}">${normalizedUrl}</a></p>
            <p><strong>Tags:</strong> ${tags.join(', ')}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Submitted by:</strong> ${submitter_email || 'Anonymous'}</p>
            <p><a href="https://epinvesting.com/admin/companies">Review in admin panel →</a></p>
          `,
        }),
      });
    } catch { /* email failure shouldn't block the response */ }

    return NextResponse.json({
      success: true,
      message: 'Company submitted successfully',
      company: { name, tags },
    });

  } catch (err) {
    console.error('Submit company error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
