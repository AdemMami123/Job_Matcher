import React from 'react'
import { ReactNode } from 'react'
import { isAuthenticated, getCurrentUser } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ProtectedLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated(); 
  if (!isUserAuthenticated) redirect('/sign-in');
  
  const user = await getCurrentUser();
  console.log('Protected layout - user data:', user);
  
  return (
    <div className='min-h-screen gradient-bg'>
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </div>
    </div>
  )
}

export default ProtectedLayout
