import React from 'react'
import UserProfileComponent from '@/components/UserProfile'
import { getUserProfile } from '@/lib/actions/profile.action'

export default async function ProfilePage() {
  const userProfile = await getUserProfile()
  
  return (
    <div className="animate-slide-up">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gradient mb-4">My Profile</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Manage your personal information, resume preferences, and view your job match statistics.
        </p>
      </div>

      <UserProfileComponent initialProfile={userProfile} />
    </div>
  )
}
