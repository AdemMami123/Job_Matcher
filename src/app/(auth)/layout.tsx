import React from 'react'
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/actions/auth.action'

const AuthLayout = async ({ children }: { children: ReactNode }) => {
   const isUserAuthenticated = await isAuthenticated(); 
   if (isUserAuthenticated) redirect('/dashboard');
   
  return (
    <div className='min-h-screen gradient-bg flex items-center justify-center p-4 animate-fade-in'>
      <div className='w-full max-w-md animate-slide-up'>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
