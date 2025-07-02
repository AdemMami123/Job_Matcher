// lib/ai.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function generateJobMatchingResponse(prompt: string) {
    try {
        const { text } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: prompt,
            maxTokens: 1000
        });
        return text;
    } catch (error) {
        console.error('AI generation failed:', error);
        throw error;
    }
}

export async function generateResumeAnalysis(resumeText: string, jobDescription: string, jobCategory?: string) {
    try {
        const prompt = `You are an expert ATS (Applicant Tracking System) specialist and career advisor. Analyze the following resume against the job description and provide a detailed scoring report.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB CATEGORY: ${jobCategory || 'General'}

ANALYSIS INSTRUCTIONS:
Provide a comprehensive analysis in JSON format with the following structure:

{
  "overallMatch": 85,
  "scores": {
    "technicalSkills": 90,
    "experienceMatch": 80,
    "keywordAlignment": 75,
    "softSkills": 85
  },
  "strengths": ["Strong technical background", "Relevant experience"],
  "weaknesses": ["Missing specific keywords", "Limited project examples"],
  "suggestions": [
    {
      "category": "Technical Skills",
      "original": "Experience with programming",
      "improved": "5+ years experience with Python, JavaScript, and React development",
      "reason": "Be more specific about technologies and experience level"
    }
  ],
  "missingKeywords": ["Python", "React", "Agile"],
  "matchedKeywords": ["JavaScript", "API", "Database"]
}

SCORING CRITERIA:
1. Technical Skills (30%): Rate alignment of technical competencies (0-100)
2. Experience Match (30%): Evaluate relevance of work history (0-100)
3. Keyword Alignment (25%): Assess ATS optimization and job-specific terms (0-100)
4. Soft Skills (15%): Analyze professional presentation and interpersonal skills (0-100)

REQUIREMENTS:
- Calculate overall match as weighted average: technical skills (30%), experience (30%), keywords (25%), soft skills (15%)
- Provide specific, actionable suggestions for improvement
- Be constructive but honest about gaps
- Focus on quantifiable achievements and ATS optimization
- Identify both matched and missing keywords

Respond with only the JSON, no additional text.`;

        const { text } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: prompt,
            maxTokens: 2000
        });

        return text;
    } catch (error) {
        console.error('Resume analysis failed:', error);
        throw error;
    }
}

export async function generateCoverLetter(
    resumeText: string, 
    jobDescription: string, 
    jobTitle: string,
    companyName: string,
    candidateName?: string,
    tone: 'professional' | 'friendly' | 'confident' = 'professional'
) {
    try {
        const prompt = `You are a professional career writer specializing in compelling cover letters. Create a personalized cover letter based on the provided information.

CANDIDATE RESUME:
${resumeText}

TARGET JOB:
- Position: ${jobTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}

CANDIDATE NAME: ${candidateName || 'Job Applicant'}
TONE: ${tone}

COVER LETTER REQUIREMENTS:
Create a compelling, personalized cover letter that:
1. Shows genuine interest in the company and position
2. Highlights relevant skills and experience from the resume
3. Demonstrates knowledge of the role requirements
4. Uses specific examples and achievements
5. Maintains ${tone} tone throughout
6. Is ATS-friendly with relevant keywords
7. Length: 3-4 paragraphs (250-400 words)

Provide response in JSON format:
{
  "coverLetter": "Complete cover letter text with proper formatting",
  "sections": {
    "opening": "Opening paragraph that grabs attention",
    "body": "Main body paragraph(s) highlighting qualifications",
    "closing": "Strong closing paragraph with call to action"
  },
  "keyHighlights": ["Main selling points emphasized in the letter"],
  "keywordsUsed": ["Important keywords from job description included"],
  "strengthsHighlighted": ["Key strengths from resume that were emphasized"],
  "suggestions": ["Tips for further customization or improvement"],
  "alternativeVersions": {
    "concise": "Shorter 200-word version",
    "detailed": "More detailed 400+ word version"
  }
}

Focus on creating a cover letter that:
- Matches the resume content to job requirements
- Shows understanding of the company/role
- Demonstrates value proposition clearly
- Uses action verbs and quantifiable achievements
- Maintains professional formatting
- Includes relevant industry keywords

Respond with only the JSON, no additional text.`;

        const { text } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: prompt,
            maxTokens: 2500
        });

        return text;
    } catch (error) {
        console.error('Cover letter generation failed:', error);
        throw error;
    }
}
