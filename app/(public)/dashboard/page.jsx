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

  // Check by email in case clerk_user_id isn't linked yet
  if (userEmail) {
    const { data: claimMatch } = await supabase
      .from('claims')
      .select('matched_company_id')
      .eq('contact_email', userEmail)
      .eq('status', 'approved')
      .single()

    if (claimMatch?.matched_company_id) {
      // Link the clerk_user_id to the company now
      await supabase
        .from('companies')
        .update({ clerk_user_id: userId })
        .eq('id', claimMatch.matched_company_id)

      redirect('/dashboard/company')
    }
  }

  const { data: investor } = await supabase
    .from('matched_requests')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (investor) redirect('/dashboard/investor')

  const { data: expert } = await supabase
    .from('experts')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (expert) redirect('/dashboard/expert')

  redirect('/dashboard/pending')
}
