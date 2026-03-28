import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ type: null }, { status: 401 })
  }

  // Check if user is a company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (company) {
    return NextResponse.json({ type: 'company' })
  }

  // Check if user is an investor
  const { data: investor } = await supabase
    .from('matched_requests')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (investor) {
    return NextResponse.json({ type: 'investor' })
  }

  return NextResponse.json({ type: null })
}
