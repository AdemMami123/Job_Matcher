import { NextRequest, NextResponse } from 'next/server'
import { generateResumeAnalysis } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    // Check authentication using cookies from the request
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie?.value) {
      console.log('No session cookie found')
      return NextResponse.json({
        success: false,
        error: 'Not authenticated - no session cookie'
      }, { status: 401 })
    }

    // Verify the session cookie
    let user;
    try {
      const { auth } = await import('@/firebase/admin')
      const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true)
      user = { id: decodedClaims.uid, email: decodedClaims.email }
      console.log('User authenticated:', user.email)
    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 })
    }

    const { resumeText, jobDescription, jobCategory } = await request.json()

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume text and job description are required' 
      }, { status: 400 })
    }

    // Try Gemini AI first, but fallback to mock analysis if API fails
    let analysis
    
    try {
      console.log('Starting Gemini AI analysis...')
      
      const geminiResponse = await generateResumeAnalysis(resumeText, jobDescription, jobCategory)
      console.log('Gemini AI response received')
      
      // Parse the JSON response
      try {
        analysis = JSON.parse(geminiResponse.trim())
        console.log('Gemini AI analysis parsed successfully')
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError)
        console.error('Raw response:', geminiResponse)
        throw new Error('Invalid JSON response from Gemini AI')
      }

      // Validate the response structure
      if (!analysis.overallMatch || !analysis.scores || !analysis.strengths || !analysis.weaknesses) {
        throw new Error('Incomplete analysis response from Gemini AI')
      }

    } catch (geminiError: any) {
      console.log('Gemini AI error, using mock analysis:', geminiError.message)
      
      // Generate mock analysis based on basic keyword matching
      const resumeLower = resumeText.toLowerCase()
      const jobLower = jobDescription.toLowerCase()
      
      // Basic keyword extraction and matching
      const techKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'api', 'typescript', 'html', 'css']
      const softKeywords = ['leadership', 'team', 'communication', 'management', 'collaboration', 'problem', 'solution']
      
      const matchedTech = techKeywords.filter(keyword => 
        resumeLower.includes(keyword) && jobLower.includes(keyword)
      )
      const matchedSoft = softKeywords.filter(keyword => 
        resumeLower.includes(keyword) && jobLower.includes(keyword)
      )
      const missingTech = techKeywords.filter(keyword => 
        jobLower.includes(keyword) && !resumeLower.includes(keyword)
      )
      
      // Calculate scores based on keyword matching
      const keywordScore = Math.min(90, (matchedTech.length + matchedSoft.length) * 15)
      const techScore = Math.min(95, matchedTech.length * 20)
      const softScore = Math.min(90, matchedSoft.length * 18)
      const experienceScore = Math.max(60, Math.min(90, resumeText.length / 100)) // Basic length-based score
      
      const overallMatch = Math.round(
        (techScore * 0.3) + (experienceScore * 0.3) + (keywordScore * 0.25) + (softScore * 0.15)
      )
      
      analysis = {
        overallMatch,
        scores: {
          technicalSkills: techScore,
          experienceMatch: experienceScore,
          keywordAlignment: keywordScore,
          softSkills: softScore
        },
        strengths: [
          ...(matchedTech.length > 2 ? ['Strong technical skill alignment'] : []),
          ...(matchedSoft.length > 1 ? ['Good soft skills presentation'] : []),
          ...(resumeText.length > 2000 ? ['Comprehensive experience documentation'] : [])
        ],
        weaknesses: [
          ...(missingTech.length > 2 ? ['Missing key technical skills'] : []),
          ...(overallMatch < 70 ? ['Limited keyword optimization'] : []),
          ...(resumeText.length < 1000 ? ['Brief experience descriptions'] : [])
        ],
        suggestions: [
          {
            category: "Technical Skills",
            original: "Current skill set",
            improved: `Add specific experience with: ${missingTech.slice(0, 3).join(', ')}`,
            reason: "These keywords appear in the job description but not in your resume"
          },
          {
            category: "Keyword Optimization", 
            original: "General descriptions",
            improved: "Use specific terms from the job posting",
            reason: "ATS systems look for exact keyword matches"
          }
        ],
        missingKeywords: missingTech.slice(0, 6),
        matchedKeywords: [...matchedTech, ...matchedSoft].slice(0, 8),
        note: "Analysis generated using fallback system due to Gemini AI API limitations. For full AI-powered analysis, check your Google AI API key and quota."
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysis
    })

  } catch (error) {
    console.error('Error analyzing match:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze resume match'
    }, { status: 500 })
  }
}
