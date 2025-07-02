'use client'

import React, { useState, useEffect } from 'react'
import { UserProfile, ProfileUpdatePayload, SavedResume } from '@/types/jobMatcher'
import { updateUserProfile, saveResume, deleteResume, setDefaultResume } from '@/lib/actions/profile.action'

interface UserProfileProps {
  initialProfile: UserProfile | null
}

export default function UserProfileComponent({ initialProfile }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileUpdatePayload>({
    displayName: '',
    profession: '',
    careerLevel: '',
    targetIndustry: '',
    targetRole: '',
    location: '',
    bio: '',
    skills: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [selectedTab, setSelectedTab] = useState('personal')
  const [skillInput, setSkillInput] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Check if we need to fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profile && !isInitialized) {
        setIsLoading(true)
        try {
          const response = await fetch('/api/user/profile')
          const data = await response.json()
          
          if (data.success && data.profile) {
            setProfile(data.profile)
          } else {
            setMessage({ 
              text: 'Could not load profile data. Please try refreshing the page.', 
              type: 'error' 
            })
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
          setMessage({ 
            text: 'Error loading profile. Please try again later.', 
            type: 'error' 
          })
        } finally {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }
    
    fetchProfileData()
  }, [profile, isInitialized])
  
  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        profession: profile.profession || '',
        careerLevel: profile.careerLevel || '',
        targetIndustry: profile.targetIndustry || '',
        targetRole: profile.targetRole || '',
        location: profile.location || '',
        bio: profile.bio || '',
        skills: [...(profile.skills || [])],
      })
    }
  }, [profile])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle skill addition
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  // Handle skill removal
  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skill) || []
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ text: '', type: '' })
    
    try {
      const result = await updateUserProfile(formData)
      
      if (result.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' })
        setIsEditing(false)
        
        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            ...formData,
            updatedAt: new Date().toISOString()
          } as UserProfile)
        }
      } else {
        setMessage({ text: result.error || 'Failed to update profile', type: 'error' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ text: 'An error occurred while updating your profile', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload for resume
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    setMessage({ text: '', type: '' })
    
    try {
      const formData = new FormData()
      formData.append('resume', file)
      
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (data.success && data.resumeText) {
        // Save the resume to user profile
        const saveResult = await saveResume({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          content: data.resumeText,
          fileSize: file.size,
          fileName: file.name,
          isDefault: profile?.savedResumes.length === 0, // Make default if it's the first resume
        })
        
        if (saveResult.success) {
          // Refresh the profile data
          const updatedProfile = await fetch('/api/user/profile').then(res => res.json())
          if (updatedProfile.success) {
            setProfile(updatedProfile.profile)
            setMessage({ text: 'Resume uploaded and saved successfully!', type: 'success' })
          }
        } else {
          setMessage({ text: saveResult.error || 'Failed to save resume', type: 'error' })
        }
      } else {
        setMessage({ text: data.error || 'Failed to upload resume', type: 'error' })
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
      setMessage({ text: 'An error occurred while uploading your resume', type: 'error' })
    } finally {
      setIsLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  // Handle setting a resume as default
  const handleSetDefaultResume = async (resumeId: string) => {
    setIsLoading(true)
    
    try {
      const result = await setDefaultResume(resumeId)
      
      if (result.success) {
        // Update local state
        if (profile) {
          const updatedResumes = profile.savedResumes.map(resume => ({
            ...resume,
            isDefault: resume.id === resumeId
          }))
          
          setProfile({
            ...profile,
            savedResumes: updatedResumes,
            preferences: {
              ...profile.preferences,
              defaultResumeId: resumeId
            }
          } as UserProfile)
          
          setMessage({ text: 'Default resume updated!', type: 'success' })
        }
      } else {
        setMessage({ text: result.error || 'Failed to update default resume', type: 'error' })
      }
    } catch (error) {
      console.error('Error setting default resume:', error)
      setMessage({ text: 'An error occurred while updating your default resume', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle resume deletion
  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return
    
    setIsLoading(true)
    
    try {
      const result = await deleteResume(resumeId)
      
      if (result.success) {
        // Update local state
        if (profile) {
          const updatedResumes = profile.savedResumes.filter(resume => resume.id !== resumeId)
          
          setProfile({
            ...profile,
            savedResumes: updatedResumes,
            preferences: {
              ...profile.preferences,
              defaultResumeId: updatedResumes.length > 0 
                ? (profile.preferences.defaultResumeId === resumeId ? updatedResumes[0].id : profile.preferences.defaultResumeId)
                : undefined
            }
          } as UserProfile)
          
          setMessage({ text: 'Resume deleted successfully!', type: 'success' })
        }
      } else {
        setMessage({ text: result.error || 'Failed to delete resume', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      setMessage({ text: 'An error occurred while deleting your resume', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        {isLoading ? (
          <div className="loading-pulse text-xl">Loading profile data...</div>
        ) : (
          <>
            <div className="text-xl mb-4 text-red-400">
              Failed to load profile data
            </div>
            <p className="text-slate-400 mb-4">
              We couldn't load your profile. This could be due to a connection issue.
            </p>
            <button
              onClick={() => {
                setIsInitialized(false);
                setIsLoading(true);
                setMessage({ text: '', type: '' });
              }}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="glass-card p-6 rounded-xl">
          <div className="mb-6 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4 text-2xl font-bold text-white">
              {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2 className="text-xl font-semibold">{profile.displayName || 'User'}</h2>
            <p className="text-slate-400">{profile.email}</p>
          </div>
          
          <div className="border-t border-slate-700 pt-6 mt-6">
            <nav>
              <button 
                onClick={() => setSelectedTab('personal')}
                className={`w-full text-left py-3 px-4 rounded-lg mb-2 flex items-center ${selectedTab === 'personal' ? 'bg-slate-700/50 text-white' : 'hover:bg-slate-700/30 text-slate-400'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Info
              </button>
              
              <button 
                onClick={() => setSelectedTab('resumes')}
                className={`w-full text-left py-3 px-4 rounded-lg mb-2 flex items-center ${selectedTab === 'resumes' ? 'bg-slate-700/50 text-white' : 'hover:bg-slate-700/30 text-slate-400'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                My Resumes
              </button>
              
              <button 
                onClick={() => setSelectedTab('stats')}
                className={`w-full text-left py-3 px-4 rounded-lg mb-2 flex items-center ${selectedTab === 'stats' ? 'bg-slate-700/50 text-white' : 'hover:bg-slate-700/30 text-slate-400'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg animate-fade-in ${message.type === 'success' ? 'bg-green-900/30 text-green-200 border border-green-700/50' : 'bg-red-900/30 text-red-200 border border-red-700/50'}`}>
            {message.text}
          </div>
        )}

        {/* Personal Info Tab */}
        {selectedTab === 'personal' && (
          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Personal Information</h2>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary text-slate-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary text-slate-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                    <input 
                      type="text" 
                      name="displayName" 
                      value={formData.displayName} 
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2 rounded-lg"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Profession</label>
                    <input 
                      type="text" 
                      name="profession" 
                      value={formData.profession || ''} 
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2 rounded-lg"
                      placeholder="e.g. Software Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Career Level</label>
                    <input 
                      type="text" 
                      name="careerLevel" 
                      value={formData.careerLevel || ''} 
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2 rounded-lg"
                      placeholder="e.g. Mid-level, Senior, Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={formData.location || ''} 
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2 rounded-lg"
                      placeholder="e.g. New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Industry</label>
                    <input 
                      type="text" 
                      name="targetIndustry" 
                      value={formData.targetIndustry || ''} 
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2 rounded-lg"
                      placeholder="e.g. Technology, Finance, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Role</label>
                    <input 
                      type="text" 
                      name="targetRole" 
                      value={formData.targetRole || ''} 
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2 rounded-lg"
                      placeholder="e.g. Senior Developer, Project Manager"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio || ''} 
                    onChange={handleChange}
                    className="input-dark w-full px-4 py-2 rounded-lg h-32"
                    placeholder="A brief description about yourself"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
                  <div className="flex mb-2">
                    <input 
                      type="text" 
                      value={skillInput} 
                      onChange={(e) => setSkillInput(e.target.value)}
                      className="input-dark flex-grow px-4 py-2 rounded-l-lg"
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    />
                    <button 
                      type="button"
                      onClick={handleAddSkill}
                      className="btn-primary px-4 py-2 rounded-r-lg"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills?.map((skill, index) => (
                      <div key={index} className="bg-slate-700/50 text-white px-3 py-1 rounded-full flex items-center text-sm">
                        {skill}
                        <button 
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-slate-400 hover:text-white"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {formData.skills?.length === 0 && (
                      <span className="text-slate-500 text-sm">No skills added yet</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn-primary px-6 py-2 rounded-lg flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Name</h3>
                    <p className="text-white">{profile.displayName || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Email</h3>
                    <p className="text-white">{profile.email}</p>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Current Profession</h3>
                    <p className="text-white">{profile.profession || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Career Level</h3>
                    <p className="text-white">{profile.careerLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Location</h3>
                    <p className="text-white">{profile.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Target Industry</h3>
                    <p className="text-white">{profile.targetIndustry || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-sm font-medium">Target Role</h3>
                    <p className="text-white">{profile.targetRole || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-400 text-sm font-medium">Bio</h3>
                  <p className="text-white">{profile.bio || 'No bio provided'}</p>
                </div>

                <div>
                  <h3 className="text-slate-400 text-sm font-medium">Skills</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, index) => (
                        <span key={index} className="bg-slate-700/50 text-white px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">No skills added yet</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumes Tab */}
        {selectedTab === 'resumes' && (
          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">My Resumes</h2>
              <p className="text-slate-400">Upload and manage your resumes. You can set one as your default for job applications.</p>
            </div>

            <div className="mb-8">
              <label className="btn-secondary inline-flex items-center px-4 py-2 rounded-lg cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload New Resume
                <input type="file" onChange={handleResumeUpload} accept=".pdf" className="hidden" />
              </label>
              <p className="mt-2 text-sm text-slate-400">Supported format: PDF (max 5MB)</p>
            </div>

            {profile.savedResumes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-slate-400">No resumes uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.savedResumes.map((resume) => (
                  <div key={resume.id} className="gradient-card rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                      <svg className="w-8 h-8 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-white">{resume.name}</h3>
                        <div className="text-xs text-slate-400">
                          <span>Uploaded on {new Date(resume.dateUploaded).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>{Math.round(resume.fileSize / 1024)} KB</span>
                          {resume.isDefault && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-blue-400">Default</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {!resume.isDefault && (
                        <button 
                          onClick={() => handleSetDefaultResume(resume.id)}
                          className="btn-secondary text-xs px-3 py-1 rounded-md"
                          disabled={isLoading}
                        >
                          Set as Default
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-3 py-1 rounded-md border border-red-800/30 hover:border-red-700/50 bg-red-900/20"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {selectedTab === 'stats' && (
          <div className="glass-card rounded-xl p-6 animate-fade-in">
            <h2 className="text-2xl font-semibold mb-6">Job Match Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="gradient-card p-4 rounded-lg">
                <h3 className="text-slate-400 text-sm font-medium">Total Analyses</h3>
                <p className="text-3xl font-semibold">{profile.stats.totalAnalyses}</p>
              </div>
              
              <div className="gradient-card p-4 rounded-lg">
                <h3 className="text-slate-400 text-sm font-medium">Highest Match</h3>
                <p className="text-3xl font-semibold">{profile.stats.highestMatchScore}%</p>
              </div>
              
              <div className="gradient-card p-4 rounded-lg">
                <h3 className="text-slate-400 text-sm font-medium">Average Match</h3>
                <p className="text-3xl font-semibold">{profile.stats.averageMatchScore}%</p>
              </div>
            </div>

            {profile.stats.analysesHistory.length > 0 ? (
              <>
                <h3 className="text-xl font-medium mb-4">Recent Match History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="pb-4 px-2">Date</th>
                        <th className="pb-4 px-2">Job Title</th>
                        <th className="pb-4 px-2">Company</th>
                        <th className="pb-4 px-2">Category</th>
                        <th className="pb-4 px-2">Match Score</th>
                        <th className="pb-4 px-2">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.stats.analysesHistory.slice(-10).reverse().map((analysis, index) => (
                        <tr key={index} className="border-t border-slate-700/30">
                          <td className="py-3 px-2 text-slate-300">{new Date(analysis.date).toLocaleDateString()}</td>
                          <td className="py-3 px-2">{analysis.jobTitle}</td>
                          <td className="py-3 px-2 text-slate-400">{analysis.companyName || 'N/A'}</td>
                          <td className="py-3 px-2 text-slate-400">{analysis.jobCategory || 'N/A'}</td>
                          <td className="py-3 px-2">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                analysis.score >= 80 ? 'bg-green-900/30 text-green-300' :
                                analysis.score >= 60 ? 'bg-yellow-900/30 text-yellow-300' :
                                'bg-red-900/30 text-red-300'
                              }`}
                            >
                              {analysis.score}%
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => {
                                const el = document.getElementById(`analysis-details-${analysis.id || index}`);
                                if (el) {
                                  el.classList.toggle('hidden');
                                }
                              }}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Analysis details sections (hidden by default) */}
                <div className="space-y-4 mt-4">
                  {profile.stats.analysesHistory.slice(-10).reverse().map((analysis, index) => (
                    <div 
                      key={index} 
                      id={`analysis-details-${analysis.id || index}`}
                      className="hidden gradient-card p-4 rounded-lg animate-fade-in"
                    >
                      <div className="flex justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium">{analysis.jobTitle}</h4>
                          <p className="text-sm text-slate-400">
                            {analysis.companyName || 'N/A'} • {analysis.jobCategory || 'N/A'} • 
                            Analyzed on {new Date(analysis.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-2xl font-semibold">
                          <span 
                            className={
                              analysis.score >= 80 ? 'text-green-400' :
                              analysis.score >= 60 ? 'text-yellow-400' :
                              'text-red-400'
                            }
                          >
                            {analysis.score}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-green-400 mb-2">Strengths</h5>
                          {analysis.strengths && analysis.strengths.length > 0 ? (
                            <ul className="space-y-1">
                              {analysis.strengths.map((strength, i) => (
                                <li key={i} className="text-sm text-slate-300">
                                  ✓ {strength}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">No specific strengths recorded</p>
                          )}
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-red-400 mb-2">Areas to Improve</h5>
                          {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                            <ul className="space-y-1">
                              {analysis.weaknesses.map((weakness, i) => (
                                <li key={i} className="text-sm text-slate-300">
                                  ✗ {weakness}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-400">No specific weaknesses recorded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Detailed strengths and weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="gradient-card p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-white">Your Top Strengths</h3>
                    <div className="space-y-2">
                      {profile.stats.topStrengths && profile.stats.topStrengths.length > 0 ? (
                        profile.stats.topStrengths.map((strength, index) => (
                          <div key={index} className="bg-green-900/20 text-green-300 rounded-lg px-3 py-2 text-sm">
                            {strength}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400">Complete more analyses to see your top strengths</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="gradient-card p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 text-white">Areas to Improve</h3>
                    <div className="space-y-2">
                      {profile.stats.commonWeaknesses && profile.stats.commonWeaknesses.length > 0 ? (
                        profile.stats.commonWeaknesses.map((weakness, index) => (
                          <div key={index} className="bg-red-900/20 text-red-300 rounded-lg px-3 py-2 text-sm">
                            {weakness}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400">Complete more analyses to see your improvement areas</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-medium mb-4">Match Trend</h3>
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        profile.stats.improvementTrend === 'improving' ? 'bg-green-900/30 text-green-300' :
                        profile.stats.improvementTrend === 'declining' ? 'bg-red-900/30 text-red-300' :
                        profile.stats.improvementTrend === 'stable' ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-slate-900/30 text-slate-300'
                      }`}
                    >
                      {profile.stats.improvementTrend === 'improving' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : profile.stats.improvementTrend === 'declining' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : profile.stats.improvementTrend === 'stable' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile.stats.improvementTrend === 'improving' ? 'Improving' :
                        profile.stats.improvementTrend === 'declining' ? 'Declining' :
                        profile.stats.improvementTrend === 'stable' ? 'Stable' :
                        'Not enough data'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {profile.stats.improvementTrend === 'improving' ? 'Your match scores are trending upward!' :
                        profile.stats.improvementTrend === 'declining' ? 'Your match scores are trending downward' :
                        profile.stats.improvementTrend === 'stable' ? 'Your match scores are remaining consistent' :
                        'Complete more analyses to see your trend'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-slate-400">No job analyses completed yet</p>
                <p className="text-sm text-slate-500">Complete a job match analysis to see your stats</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
