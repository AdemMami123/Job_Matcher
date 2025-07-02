import { NextRequest, NextResponse } from 'next/server'
import { generateCoverLetter } from '@/lib/ai'

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
    try {
      const { auth } = await import('@/firebase/admin')
      const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true)
      console.log('User authenticated for cover letter generation:', decodedClaims.email)
    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 })
    }

    const { 
      resumeText, 
      jobDescription, 
      jobTitle,
      companyName,
      candidateName,
      tone = 'professional'
    } = await request.json()

    if (!resumeText || !jobDescription || !jobTitle || !companyName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume text, job description, job title, and company name are required' 
      }, { status: 400 })
    }

    console.log('Generating cover letter with Gemini AI...')

    try {
      // Generate cover letter using Gemini AI
      const coverLetterResponse = await generateCoverLetter(
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        candidateName,
        tone as 'professional' | 'friendly' | 'confident'
      )

      console.log('Gemini AI cover letter response received')

      // Parse the JSON response
      let coverLetterData
      try {
        coverLetterData = JSON.parse(coverLetterResponse.trim())
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError)
        console.error('Raw response:', coverLetterResponse)
        throw new Error('Invalid JSON response from AI')
      }

      // Validate the response structure
      if (!coverLetterData.coverLetter || !coverLetterData.sections) {
        throw new Error('Incomplete cover letter response')
      }

      return NextResponse.json({
        success: true,
        coverLetter: coverLetterData
      })

    } catch (geminiError: any) {
      console.error('Gemini AI error for cover letter:', geminiError.message)
      
      // Fallback to basic template
      const fallbackCoverLetter = generateFallbackCoverLetter(
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        candidateName || 'Applicant'
      )

      return NextResponse.json({
        success: true,
        coverLetter: {
          ...fallbackCoverLetter,
          note: "Cover letter generated using template due to AI service limitations. For full AI-powered generation, please try again later."
        }
      })
    }

  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate cover letter'
    }, { status: 500 })
  }
}

// Fallback cover letter generator
function generateFallbackCoverLetter(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  candidateName: string
) {
  const resumeLower = resumeText.toLowerCase()
  const jobLower = jobDescription.toLowerCase()
  
  // Extract some basic skills/keywords
  const techKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'api', 'typescript']
  const matchedSkills = techKeywords.filter(skill => resumeLower.includes(skill) && jobLower.includes(skill))
  
  const opening = `Dear ${companyName} Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With my background in software development and proven track record of delivering high-quality solutions, I am excited about the opportunity to contribute to your team.`
  
  const body = `In my previous roles, I have gained valuable experience working with ${matchedSkills.length > 0 ? matchedSkills.slice(0, 3).join(', ') : 'various technologies'} and have consistently delivered projects that meet both technical requirements and business objectives. My experience aligns well with the requirements outlined in your job description, particularly in areas of ${matchedSkills.length > 0 ? matchedSkills[0] : 'software development'} and collaborative team environments.\n\nI am particularly drawn to ${companyName} because of your commitment to innovation and excellence. I believe my technical skills and passion for problem-solving would make me a valuable addition to your development team.`
  
  const closing = `I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${companyName}'s continued success. Thank you for considering my application. I look forward to hearing from you.\n\nSincerely,\n${candidateName}`
  
  const fullLetter = `${opening}\n\n${body}\n\n${closing}`
  
  return {
    coverLetter: fullLetter,
    sections: {
      opening: opening,
      body: body,
      closing: closing
    },
    keyHighlights: [
      "Technical experience alignment",
      "Interest in company values",
      "Problem-solving abilities"
    ],
    keywordsUsed: matchedSkills.slice(0, 5),
    strengthsHighlighted: [
      "Software development experience",
      "Team collaboration",
      "Project delivery"
    ],
    suggestions: [
      "Customize the opening to mention specific company achievements",
      "Add specific project examples from your resume",
      "Research the company culture to personalize further"
    ],
    alternativeVersions: {
      concise: `${opening}\n\n${body.split('\n\n')[0]}\n\n${closing}`,
      detailed: `${opening}\n\n${body}\n\nAdditionally, I have experience in project management and cross-functional collaboration, which I believe would be valuable in this role.\n\n${closing}`
    }
  }
}
