import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export interface ResumeValidationResult {
  isResume: boolean;
  confidence: number;
  reasons: string[];
  documentType: string;
  suggestions?: string[];
}

export async function validateResumeContent(resumeText: string): Promise<ResumeValidationResult> {
  try {
    const validationPrompt = `You are an expert document classifier specializing in resume/CV identification. Analyze the following document content and determine if it's a legitimate resume/CV.

DOCUMENT CONTENT:
${resumeText}

ANALYSIS INSTRUCTIONS:
Determine if this document is a resume/CV by checking for:

1. PERSONAL INFORMATION: Name, contact details (email, phone, address)
2. PROFESSIONAL SUMMARY/OBJECTIVE: Career goals or professional summary
3. WORK EXPERIENCE: Job titles, companies, dates, responsibilities
4. EDUCATION: Degrees, institutions, graduation dates
5. SKILLS: Technical skills, software proficiency, languages
6. ACHIEVEMENTS: Accomplishments, awards, certifications

CLASSIFICATION CRITERIA:
- TRUE RESUME: Contains at least 4 of the 6 elements above
- PARTIAL RESUME: Contains 2-3 elements (incomplete resume)
- NOT A RESUME: Contains 0-1 elements (random document, manual, article, etc.)

Provide your analysis in this exact JSON format:
{
  "isResume": true/false,
  "confidence": 0-100,
  "reasons": ["Specific reasons why this is/isn't a resume"],
  "documentType": "Full Resume|Partial Resume|Cover Letter|Academic Paper|Manual|Article|Unknown Document|Other",
  "suggestions": ["If not a resume, what type of document this appears to be"]
}

IMPORTANT: 
- Be strict in classification
- A document must clearly be a resume/CV to return isResume: true
- Consider context and structure, not just keywords
- If confidence is below 70%, mark as not a resume
- Respond with ONLY the JSON, no additional text`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: validationPrompt,
      maxTokens: 500
    });

    const result = JSON.parse(text.trim());
    
    // Additional validation for safety
    if (typeof result.isResume !== 'boolean' || typeof result.confidence !== 'number') {
      throw new Error('Invalid validation response format');
    }

    return result;

  } catch (error) {
    console.error('Resume validation error:', error);
    
    // Fallback validation using keyword-based approach
    return fallbackResumeValidation(resumeText);
  }
}

function fallbackResumeValidation(resumeText: string): ResumeValidationResult {
  const text = resumeText.toLowerCase();
  let score = 0;
  const reasons: string[] = [];
  
  // Check for personal information indicators
  const personalIndicators = ['email', 'phone', 'address', '@', '+1', 'linkedin', 'github'];
  const hasPersonalInfo = personalIndicators.some(indicator => text.includes(indicator));
  if (hasPersonalInfo) {
    score += 20;
    reasons.push('Contains contact information');
  }

  // Check for work experience indicators
  const workIndicators = ['experience', 'employment', 'worked', 'company', 'position', 'manager', 'developer', 'analyst', 'coordinator'];
  const workMatches = workIndicators.filter(indicator => text.includes(indicator)).length;
  if (workMatches >= 2) {
    score += 25;
    reasons.push('Contains work experience information');
  }

  // Check for education indicators
  const educationIndicators = ['education', 'university', 'college', 'degree', 'bachelor', 'master', 'phd', 'graduated', 'gpa'];
  const educationMatches = educationIndicators.filter(indicator => text.includes(indicator)).length;
  if (educationMatches >= 1) {
    score += 20;
    reasons.push('Contains education information');
  }

  // Check for skills indicators
  const skillIndicators = ['skills', 'proficient', 'experienced', 'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css'];
  const skillMatches = skillIndicators.filter(indicator => text.includes(indicator)).length;
  if (skillMatches >= 2) {
    score += 20;
    reasons.push('Contains technical skills');
  }

  // Check for resume structure indicators
  const structureIndicators = ['summary', 'objective', 'achievements', 'accomplishments', 'responsibilities', 'projects'];
  const structureMatches = structureIndicators.filter(indicator => text.includes(indicator)).length;
  if (structureMatches >= 1) {
    score += 15;
    reasons.push('Has resume-like structure');
  }

  // Check against non-resume content
  const nonResumeIndicators = ['chapter', 'section', 'page', 'figure', 'table of contents', 'references', 'bibliography', 'abstract'];
  const nonResumeMatches = nonResumeIndicators.filter(indicator => text.includes(indicator)).length;
  if (nonResumeMatches >= 2) {
    score -= 30;
    reasons.push('Contains academic/manual content indicators');
  }

  const isResume = score >= 60;
  const confidence = Math.min(100, Math.max(0, score));

  return {
    isResume,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['Unable to determine document type clearly'],
    documentType: isResume ? 'Resume/CV' : 'Other Document',
    suggestions: isResume ? [] : ['This appears to be a non-resume document. Please upload a proper CV/resume.']
  };
}
