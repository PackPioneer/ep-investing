import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
      <SignIn />
    </div>
  )
}
