'use client'

import React, { useState } from 'react'
import ResumeUploader from './ResumeUploader'
import JobDescriptionForm from './JobDescriptionForm'
import MatchScoreCard from './MatchScoreCard'
import FeedbackSection from './FeedbackSection'
import CoverLetterGenerator from './CoverLetterGenerator'
import { MatchAnalysis } from '@/types/auth'
import { trackAnalysis } from '@/lib/actions/profile.action'

export default function MatchAnalyzer() {
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'analysis' | 'cover-letter'>('analysis')

  const handleResumeUploaded = (text: string, fileName: string) => {
    setResumeText(text)
    setResumeFileName(fileName)
    setError('')
  }

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      setError('Please upload a resume and enter a job description')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/match/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobCategory
        }),
      })

      const data = await response.json()
      if (data.success) {
        setAnalysis(data.analysis)
        setActiveTab('analysis') // Always start with analysis tab
        
        // Track this analysis in user stats with enhanced details
        if (data.analysis.jobMatch && jobTitle) {
          // Extract strengths and weaknesses for tracking
          const strengths = [
            ...(data.analysis.jobMatch.matchReasons?.skillsMatch >= 70 ? ['Strong skill match'] : []),
            ...(data.analysis.jobMatch.matchReasons?.experienceMatch >= 70 ? ['Experience level match'] : []),
            ...(data.analysis.jobMatch.pros || [])
          ].slice(0, 5); // Take top 5 strengths
          
          const weaknesses = [
            ...(data.analysis.jobMatch.matchReasons?.skillsMatch < 50 ? ['Skill gap'] : []),
            ...(data.analysis.jobMatch.matchReasons?.experienceMatch < 50 ? ['Experience gap'] : []),
            ...(data.analysis.jobMatch.cons || [])
          ].slice(0, 5); // Take top 5 weaknesses
          
          await trackAnalysis(
            jobTitle,
            data.analysis.jobMatch.matchScore,
            companyName,
            jobCategory,
            strengths,
            weaknesses
          );
        }
      } else {
        setError(data.error || 'Error analyzing resume')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error analyzing resume')
    } finally {
      setLoading(false)
    }
  }

  const resetAnalysis = () => {
    setAnalysis(null)
    setError('')
    setActiveTab('analysis')
  }

  return (
    <div className="space-y-8">
      {/* Upload and Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ResumeUploader onResumeUploaded={handleResumeUploaded} />
        <JobDescriptionForm
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          jobCategory={jobCategory}
          setJobCategory={setJobCategory}
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          companyName={companyName}
          setCompanyName={setCompanyName}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleAnalyze}
          disabled={loading || !resumeText || !jobDescription}
          className="btn-primary py-3 px-8 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyze Match
            </>
          )}
        </button>
        
        {analysis && (
          <button
            onClick={resetAnalysis}
            className="btn-secondary py-3 px-8 rounded-lg font-medium transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Analysis
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Results Section */}
      {analysis && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition duration-200 ${
                activeTab === 'analysis'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              📊 Match Analysis
            </button>
            <button
              onClick={() => setActiveTab('cover-letter')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition duration-200 ${
                activeTab === 'cover-letter'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              📝 Cover Letter
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'analysis' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-slide-up">
              <MatchScoreCard analysis={analysis} />
              <FeedbackSection analysis={analysis} />
            </div>
          ) : (
            <div className="animate-slide-up">
              {jobTitle && companyName ? (
                <CoverLetterGenerator
                  resumeText={resumeText}
                  jobDescription={jobDescription}
                  jobTitle={jobTitle}
                  companyName={companyName}
                />
              ) : (
                <div className="card-dark p-6 rounded-xl text-center">
                  <div className="text-yellow-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Missing Information</h3>
                  <p className="text-slate-400 mb-4">
                    To generate a cover letter, please provide the job title and company name in the job description form.
                  </p>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="btn-secondary py-2 px-4 rounded-lg font-medium transition duration-200"
                  >
                    Back to Analysis
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
