import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/actions/auth.action'

export default async function Home() {
  const authenticated = await isAuthenticated()
  
  if (authenticated) {
    redirect('/dashboard')
  } else {
    redirect('/sign-in')
  }
}
