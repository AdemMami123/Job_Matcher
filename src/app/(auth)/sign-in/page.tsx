'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { setSessionCookie } from '@/lib/actions/auth.action'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      
      const result = await setSessionCookie(idToken)
      
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError('Failed to create session')
      }
    } catch (error: any) {
      setError(error.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-lg p-8 animate-scale-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400">Sign in to your Smart Job Matcher account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded backdrop-blur-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-dark w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-dark w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-400">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
