'use client'

import React, { useState } from 'react'
import { CoverLetterData } from '@/types/jobMatcher'

interface CoverLetterGeneratorProps {
  resumeText: string
  jobDescription: string
  jobTitle: string
  companyName: string
}

export default function CoverLetterGenerator({
  resumeText,
  jobDescription,
  jobTitle,
  companyName
}: CoverLetterGeneratorProps) {
  const [candidateName, setCandidateName] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'confident'>('professional')
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeVersion, setActiveVersion] = useState<'main' | 'concise' | 'detailed'>('main')

  const handleGenerate = async () => {
    if (!candidateName.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          jobTitle,
          companyName,
          candidateName: candidateName.trim(),
          tone
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCoverLetter(data.coverLetter)
      } else {
        setError(data.error || 'Error generating cover letter')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error generating cover letter')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!coverLetter) return
    
    const textToCopy = activeVersion === 'main' 
      ? coverLetter.coverLetter
      : activeVersion === 'concise' 
      ? coverLetter.alternativeVersions.concise
      : coverLetter.alternativeVersions.detailed

    try {
      await navigator.clipboard.writeText(textToCopy)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleDownload = () => {
    if (!coverLetter) return
    
    const textToDownload = activeVersion === 'main' 
      ? coverLetter.coverLetter
      : activeVersion === 'concise' 
      ? coverLetter.alternativeVersions.concise
      : coverLetter.alternativeVersions.detailed

    const blob = new Blob([textToDownload], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${candidateName.replace(/\s+/g, '_')}_Cover_Letter_${companyName.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getCurrentCoverLetter = () => {
    if (!coverLetter) return ''
    
    switch (activeVersion) {
      case 'concise':
        return coverLetter.alternativeVersions.concise
      case 'detailed':
        return coverLetter.alternativeVersions.detailed
      default:
        return coverLetter.coverLetter
    }
  }

  return (
    <div className="card-dark p-6 rounded-xl animate-scale-in">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        AI Cover Letter Generator
      </h2>

      {/* Input Section */}
      {!coverLetter && (
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="candidateName" className="block text-sm font-medium text-slate-300 mb-2">
              Your Full Name *
            </label>
            <input
              type="text"
              id="candidateName"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter your full name"
              className="input-dark w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="tone" className="block text-sm font-medium text-slate-300 mb-2">
              Cover Letter Tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as 'professional' | 'friendly' | 'confident')}
              className="input-dark w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="confident">Confident</option>
            </select>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-2">Position Details</h3>
            <p className="text-slate-300 text-sm"><strong>Job Title:</strong> {jobTitle}</p>
            <p className="text-slate-300 text-sm"><strong>Company:</strong> {companyName}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Generate Button */}
      {!coverLetter && (
        <button
          onClick={handleGenerate}
          disabled={loading || !candidateName.trim()}
          className="w-full btn-primary py-3 px-6 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              <span>Generating Cover Letter...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Generate Cover Letter
            </>
          )}
        </button>
      )}

      {/* Generated Cover Letter */}
      {coverLetter && (
        <div className="space-y-6">
          {/* Demo Mode Notice */}
          {coverLetter.note && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium">Template Mode Active</p>
                <p className="text-sm mt-1">{coverLetter.note}</p>
              </div>
            </div>
          )}

          {/* Version Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveVersion('main')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                activeVersion === 'main' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setActiveVersion('concise')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                activeVersion === 'concise' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Concise
            </button>
            <button
              onClick={() => setActiveVersion('detailed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                activeVersion === 'detailed' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* Cover Letter Display */}
          <div className="bg-white p-8 rounded-lg text-gray-900 font-serif leading-relaxed">
            <pre className="whitespace-pre-wrap font-serif text-gray-900">
              {getCurrentCoverLetter()}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleCopy}
              className="flex-1 btn-secondary py-3 px-6 rounded-lg font-medium transition duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 btn-secondary py-3 px-6 rounded-lg font-medium transition duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
            <button
              onClick={() => setCoverLetter(null)}
              className="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg font-medium transition duration-200 hover:bg-slate-600"
            >
              Generate New
            </button>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-green-400 mb-2">Key Highlights</h3>
              <ul className="space-y-1">
                {coverLetter.keyHighlights.map((highlight, index) => (
                  <li key={index} className="text-slate-300 text-sm flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-400 mb-2">Keywords Used</h3>
              <div className="flex flex-wrap gap-2">
                {coverLetter.keywordsUsed.map((keyword, index) => (
                  <span key={index} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-400 mb-2">Strengths Highlighted</h3>
              <ul className="space-y-1">
                {coverLetter.strengthsHighlighted.map((strength, index) => (
                  <li key={index} className="text-slate-300 text-sm flex items-start">
                    <span className="text-purple-400 mr-2">★</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-400 mb-2">Improvement Tips</h3>
              <ul className="space-y-1">
                {coverLetter.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-slate-300 text-sm flex items-start">
                    <span className="text-yellow-400 mr-2">💡</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
