import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/dashboard/detect`,
    {
      headers: { 'x-clerk-user-id': userId },
      cache: 'no-store',
    }
  )

  const data = await res.json()

  if (data.type === 'company') {
    redirect('/dashboard/company')
  } else if (data.type === 'investor') {
    redirect('/dashboard/investor')
  } else {
    redirect('/')
  }
}
