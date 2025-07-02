'use client'

import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface ResumeUploaderProps {
  onResumeUploaded: (resumeText: string, fileName: string) => void
}

export default function ResumeUploader({ onResumeUploaded }: ResumeUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('resume', file)

    try {
      console.log('Uploading file:', file.name, file.type, file.size)
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)
      console.log('Response content-type:', response.headers.get('content-type'))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        onResumeUploaded(data.resumeText, data.filename)
        setFileName(data.filename)
      } else {
        // Enhanced error handling for validation failures
        if (data.details) {
          const { documentType, confidence, reasons, suggestions } = data.details
          setError(
            `${data.error}\n\n` +
            `Document Type Detected: ${documentType}\n` +
            `Confidence: ${confidence}%\n` +
            `Reasons: ${reasons.join(', ')}\n` +
            (suggestions?.length ? `Suggestions: ${suggestions.join(', ')}` : '')
          )
        } else {
          setError(data.error || 'Error uploading resume')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(`Error uploading resume: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  })

  return (
    <div className="card-dark p-6 rounded-xl animate-scale-in">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Resume
      </h2>
      
      <div
        {...getRootProps()}
        className={`dropzone-dark rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-400 bg-blue-500/10 scale-105'
            : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="text-blue-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="font-medium">Uploading and parsing...</p>
            <p className="text-sm text-slate-500 mt-1">This may take a few seconds</p>
          </div>
        ) : fileName ? (
          <div className="text-green-400">
            <div className="text-4xl mb-4">✓</div>
            <p className="font-medium text-white">Successfully uploaded: {fileName}</p>
            <p className="text-sm text-slate-400 mt-2">
              Click or drag to upload a different file
            </p>
          </div>
        ) : (
          <div className="text-slate-400">
            <div className="text-5xl mb-4">📄</div>
            <p className="font-medium text-white mb-2">Drag & drop your resume/CV here, or click to select</p>
            <p className="text-sm">Supports PDF and DOCX files (up to 10MB)</p>
            <p className="text-xs text-yellow-400 mt-2">⚠️ Only actual resumes/CVs are accepted. Other documents will be rejected.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="whitespace-pre-line text-sm">{error}</div>
          </div>
        </div>
      )}
    </div>
  )
}
