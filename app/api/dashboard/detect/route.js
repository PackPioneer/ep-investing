import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return NextResponse.json({ type: null }, { status: 401 })
  }

  // Check if admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  const userEmail = sessionClaims?.email
  if (adminEmails.includes(userEmail)) {
    return NextResponse.json({ type: 'admin' })
  }

  // Check if company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (company) {
    return NextResponse.json({ type: 'company' })
  }

  // Check if investor
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
