'use client'

import React from 'react'
import { logout } from '@/lib/actions/auth.action'
import { useRouter } from 'next/navigation'
import { User } from '@/types/auth'

interface NavbarProps {
  user: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  console.log('Navbar - user prop:', user);

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="glass-card border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="text-xl font-bold text-gradient hover:opacity-80 transition-opacity cursor-pointer"
            >
              Smart Job Matcher
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-slate-400">Welcome, </span>
                  <span className="font-medium text-white">{user.name || user.email || 'User'}</span>
                </div>
                <button
                  onClick={() => router.push('/profile')}
                  className="btn-secondary text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              /* Show logout anyway if we're in protected route but user data is missing */
              <button
                onClick={handleLogout}
                className="btn-secondary text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
