import React from 'react'
import ResumeUploader from '@/components/ResumeUploader'
import JobDescriptionForm from '@/components/JobDescriptionForm'
import MatchAnalyzer from '@/components/MatchAnalyzer'

export default function Dashboard() {
  return (
    <div className="animate-slide-up">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gradient mb-4">Smart Job Matcher</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Upload your resume and compare it with job descriptions using AI-powered analysis. 
          Get detailed feedback and suggestions to improve your job application success rate.
        </p>
      </div>

      <MatchAnalyzer />
    </div>
  )
}
