import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  if (adminEmails.includes(userEmail)) {
    redirect('/admin')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (company) redirect('/dashboard/company')

  const { data: investor } = await supabase
    .from('matched_requests')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (investor) redirect('/dashboard/investor')

 redirect('/onboarding/researcher')
}
