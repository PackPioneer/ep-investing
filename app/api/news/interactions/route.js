/**
 * app/api/news/interactions/route.js
 *
 * Logs a user's interaction with an article (save, dismiss, view, thumb).
 * Writes to user_news_interactions, which feeds back into the ranking
 * function's interaction score component.
 *
 *   POST /api/news/interactions
 *   { article_id: 123, action: 'save' | 'dismiss' | 'view' | 'thumb_up' | 'thumb_down' | 'click_out' }
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['view', 'save', 'dismiss', 'thumb_up', 'thumb_down', 'click_out'];

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { article_id, action } = body;

  if (!article_id || !Number.isFinite(Number(article_id))) {
    return NextResponse.json({ error: 'article_id required' }, { status: 400 });
  }
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of ${VALID_ACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.from('user_news_interactions').insert({
    clerk_user_id: userId,
    article_id: Number(article_id),
    action,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
