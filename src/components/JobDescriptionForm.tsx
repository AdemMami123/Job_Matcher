'use client'

import React from 'react'

interface JobDescriptionFormProps {
  jobDescription: string
  setJobDescription: (value: string) => void
  jobCategory: string
  setJobCategory: (value: string) => void
  jobTitle: string
  setJobTitle: (value: string) => void
  companyName: string
  setCompanyName: (value: string) => void
}

const jobCategories = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'Marketing Manager',
  'Sales Representative',
  'UX/UI Designer',
  'Business Analyst',
  'Project Manager',
  'DevOps Engineer',
  'Data Analyst',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'Quality Assurance',
  'Other'
]

export default function JobDescriptionForm({
  jobDescription,
  setJobDescription,
  jobCategory,
  setJobCategory,
  jobTitle,
  setJobTitle,
  companyName,
  setCompanyName
}: JobDescriptionFormProps) {
  return (
    <div className="card-dark p-6 rounded-xl animate-scale-in">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Job Description
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-300 mb-2">
            Job Title
          </label>
          <input
            type="text"
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="input-dark w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google, Microsoft, Startup Inc."
            className="input-dark w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label htmlFor="jobCategory" className="block text-sm font-medium text-slate-300 mb-2">
            Job Category
          </label>
          <select
            id="jobCategory"
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
            className="input-dark w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="" className="bg-slate-800">Select a category...</option>
            {jobCategories.map((category) => (
              <option key={category} value={category} className="bg-slate-800">
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-300 mb-2">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={12}
            placeholder="Paste the job description here..."
            className="input-dark custom-scrollbar w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
          />
          <div className="mt-2 text-xs text-slate-500">
            {jobDescription.length} characters
          </div>
        </div>
      </div>
    </div>
  )
}
