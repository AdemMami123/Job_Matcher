'use client'

import { useState } from 'react'
import { auth } from '@/firebase/config'
import { signUp, setSessionCookie } from '@/lib/actions/auth.action'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      console.log('Starting sign-up process...')
      
      // Create user and save to Firestore using server action only
      const result = await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })

      console.log('Server sign-up result:', result)

      if (result.success) {
        console.log('Server-side user creation successful, signing in client-side...')
        
        // Sign in the user client-side to get the ID token
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        )
        
        console.log('Client-side sign-in successful')
        
        // Get ID token and set session cookie
        const idToken = await userCredential.user.getIdToken()
        const sessionResult = await setSessionCookie(idToken)
        
        console.log('Session cookie result:', sessionResult)
        
        if (sessionResult.success) {
          console.log('Redirecting to dashboard...')
          router.push('/dashboard')
        } else {
          setError('Failed to create session')
        }
      } else {
        setError(result.error || 'Sign up failed')
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      setError(error.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-lg p-8 animate-scale-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-slate-400">Join Smart Job Matcher to analyze your resume</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded backdrop-blur-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-dark w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input-dark w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="input-dark w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm your password"
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
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
