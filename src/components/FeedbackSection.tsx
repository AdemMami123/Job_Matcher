'use client'

import React, { useState } from 'react'
import { MatchAnalysis } from '@/types/auth'

interface FeedbackSectionProps {
  analysis: MatchAnalysis
}

export default function FeedbackSection({ analysis }: FeedbackSectionProps) {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Text-to-Speech functionality
  const speakText = (text: string, index?: number) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        if (index !== undefined) setSpeakingIndex(index)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setSpeakingIndex(null)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        setSpeakingIndex(null)
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setSpeakingIndex(null)
  }

  const speakOverallFeedback = () => {
    const overallText = `Your overall match score is ${analysis.overallMatch} percent. ${
      analysis.overallMatch >= 80 
        ? 'Excellent match! You\'re a strong candidate for this role.'
        : analysis.overallMatch >= 60 
        ? 'Good match with room for improvement.'
        : 'Significant gaps identified. Consider the suggestions provided.'
    }`
    speakText(overallText)
  }

  return (
    <div className="card-dark p-6 rounded-xl animate-scale-in">
      {/* Mock Analysis Notice */}
      {(analysis as any).note && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">{(analysis as any).note}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Feedback & Suggestions
        </h2>
        
        {/* TTS Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={speakOverallFeedback}
            disabled={isSpeaking}
            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition duration-200 disabled:opacity-50"
            title="Read overall feedback aloud"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 12H5l3-3v6l-3-3h4z" />
            </svg>
          </button>
          
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition duration-200"
              title="Stop reading"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-6">
        <h3 className="font-medium text-green-400 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Strengths ({analysis.strengths.length})
        </h3>
        <div className="space-y-3">
          {analysis.strengths.map((strength, index) => (
            <div key={index} className="flex items-start bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
              <span className="text-green-400 mr-3 mt-0.5">✓</span>
              <span className="text-slate-300">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="mb-6">
        <h3 className="font-medium text-red-400 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Areas for Improvement ({analysis.weaknesses.length})
        </h3>
        <div className="space-y-3">
          {analysis.weaknesses.map((weakness, index) => (
            <div key={index} className="flex items-start bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <span className="text-red-400 mr-3 mt-0.5">⚠</span>
              <span className="text-slate-300">{weakness}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div>
        <h3 className="font-medium text-purple-400 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI-Powered Suggestions ({analysis.suggestions.length})
        </h3>
        
        <div className="space-y-4 custom-scrollbar max-h-96 overflow-y-auto">
          {analysis.suggestions.map((suggestion, index) => (
            <div key={index} className="border border-slate-600 rounded-lg p-4 bg-slate-800/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{suggestion.category}</h4>
                <button
                  onClick={() => speakText(
                    `For ${suggestion.category}: ${suggestion.reason}. Original text: ${suggestion.original}. Improved version: ${suggestion.improved}`,
                    index
                  )}
                  disabled={isSpeaking}
                  className={`p-2 rounded transition duration-200 ${
                    speakingIndex === index 
                      ? 'text-blue-400 bg-blue-500/20' 
                      : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/20'
                  } disabled:opacity-50`}
                  title="Read suggestion aloud"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 12H5l3-3v6l-3-3h4z" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Original:</p>
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-300 text-sm">
                    {suggestion.original}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400 mb-2">Improved:</p>
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded text-green-300 text-sm">
                    {suggestion.improved}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400 mb-2">Reason:</p>
                  <p className="text-sm text-slate-300 italic bg-blue-500/10 border border-blue-500/20 p-3 rounded">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Controls Info */}
      {!('speechSynthesis' in window) && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            Text-to-speech is not supported in your browser. For accessibility features, please use a modern browser.
          </p>
        </div>
      )}
    </div>
  )
}
