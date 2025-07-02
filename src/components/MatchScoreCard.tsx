'use client'

import React from 'react'
import { MatchAnalysis } from '@/types/auth'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

interface MatchScoreCardProps {
  analysis: MatchAnalysis
}

export default function MatchScoreCard({ analysis }: MatchScoreCardProps) {
  // Doughnut chart data for overall match
  const doughnutData = {
    labels: ['Match', 'Gap'],
    datasets: [
      {
        data: [analysis.overallMatch, 100 - analysis.overallMatch],
        backgroundColor: [
          analysis.overallMatch >= 80 ? '#10B981' : analysis.overallMatch >= 60 ? '#F59E0B' : '#EF4444',
          '#E5E7EB'
        ],
        borderWidth: 0,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    cutout: '70%',
  }

  // Bar chart data for individual scores
  const barData = {
    labels: ['Technical Skills', 'Experience', 'Keywords', 'Soft Skills'],
    datasets: [
      {
        label: 'Score',
        data: [
          analysis.scores.technicalSkills,
          analysis.scores.experienceMatch,
          analysis.scores.keywordAlignment,
          analysis.scores.softSkills,
        ],
        backgroundColor: [
          '#3B82F6',
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
        ],
        borderRadius: 6,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%'
          }
        }
      },
    },
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20'
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  const getStatusBadge = (score: number) => {
    if (score >= 80) return 'status-excellent'
    if (score >= 60) return 'status-good'
    return 'status-poor'
  }

  return (
    <div className="card-dark p-6 rounded-xl animate-scale-in">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Match Analysis
      </h2>
      
      {/* Overall Match Score */}
      <div className="text-center mb-8">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overallMatch)} animate-pulse`}>
                {analysis.overallMatch}%
              </div>
              <div className="text-xs text-slate-500">Overall Match</div>
            </div>
          </div>
        </div>
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(analysis.overallMatch)}`}>
          {analysis.overallMatch >= 80 
            ? '🎉 Excellent Match!'
            : analysis.overallMatch >= 60 
            ? '👍 Good Match'
            : '⚠️ Needs Improvement'}
        </div>
        <p className="text-slate-400 text-sm mt-3">
          {analysis.overallMatch >= 80 
            ? 'You\'re a strong candidate for this role.'
            : analysis.overallMatch >= 60 
            ? 'Good match with room for improvement.'
            : 'Significant gaps identified. Check suggestions below.'}
        </p>
      </div>

      {/* Individual Scores */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-slate-300">Detailed Breakdown</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border backdrop-blur-sm ${getScoreBackground(analysis.scores.technicalSkills)}`}>
            <div className="text-sm text-slate-400 mb-1">Technical Skills</div>
            <div className={`text-xl font-bold ${getScoreColor(analysis.scores.technicalSkills)}`}>
              {analysis.scores.technicalSkills}%
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border backdrop-blur-sm ${getScoreBackground(analysis.scores.experienceMatch)}`}>
            <div className="text-sm text-slate-400 mb-1">Experience</div>
            <div className={`text-xl font-bold ${getScoreColor(analysis.scores.experienceMatch)}`}>
              {analysis.scores.experienceMatch}%
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border backdrop-blur-sm ${getScoreBackground(analysis.scores.keywordAlignment)}`}>
            <div className="text-sm text-slate-400 mb-1">Keywords</div>
            <div className={`text-xl font-bold ${getScoreColor(analysis.scores.keywordAlignment)}`}>
              {analysis.scores.keywordAlignment}%
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border backdrop-blur-sm ${getScoreBackground(analysis.scores.softSkills)}`}>
            <div className="text-sm text-slate-400 mb-1">Soft Skills</div>
            <div className={`text-xl font-bold ${getScoreColor(analysis.scores.softSkills)}`}>
              {analysis.scores.softSkills}%
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64 mb-6">
        <Bar data={barData} options={barOptions} />
      </div>

      {/* Keywords Section */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-green-400 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Matched Keywords ({analysis.matchedKeywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.matchedKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-red-400 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Missing Keywords ({analysis.missingKeywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full border border-red-500/30"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
