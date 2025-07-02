import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Skip during build/prerender to avoid issues
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'phase-export';

export async function POST(request: NextRequest) {
  console.log('API route called: /api/resume/upload')
  
  if (isBuildPhase) {
    console.log('Build phase detected, returning mock response');
    return NextResponse.json({
      success: true,
      resumeText: "This is a mock resume text for build phase",
      filename: "mock-file.pdf"
    });
  }
  
  try {
    console.log('Parsing form data...')
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('Form data parsing error:', formError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse form data' 
      }, { status: 400 });
    }
    
    if (!formData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid form data' 
      }, { status: 400 });
    }
    
    // Debug information
    const formKeys = Array.from(formData.keys());
    console.log('Form data keys:', formKeys);
    
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.log('No file found in form data');
      return NextResponse.json({ 
        success: false, 
        error: `No file uploaded. Make sure the form field is named "file". Available fields: ${formKeys.join(', ')}` 
      }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files are supported' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temporary file path and ensure directory exists
    const tempDir = join(process.cwd(), 'temp');
    
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      try {
        await mkdir(tempDir, { recursive: true });
      } catch (mkdirError) {
        console.error('Failed to create temp directory:', mkdirError);
        // Continue without temp directory
      }
    }

    let resumeText = '';

    // Safe PDF parsing with fallback mechanisms
    try {
      // Dynamically import pdf-parse only at runtime
      const pdfParseModule = await import('pdf-parse').catch(importError => {
        console.error('Failed to import pdf-parse:', importError);
        throw new Error('PDF parsing module could not be loaded');
      });
      
      const pdfParse = pdfParseModule.default;
      
      if (!pdfParse || typeof pdfParse !== 'function') {
        throw new Error('PDF parser is not a function');
      }
      
      console.log('Starting PDF parsing...');
      
      // Define type for PDF data
      interface PDFData {
        text: string;
        numpages: number;
        info: Record<string, any>;
        metadata: Record<string, any>;
        version: string;
      }
      
      // Wrap PDF parsing in a timeout promise to prevent hanging
      const parsePdfWithTimeout = async (buffer: Buffer, timeoutMs = 30000): Promise<PDFData> => {
        return Promise.race([
          pdfParse(buffer) as Promise<PDFData>,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('PDF parsing timed out')), timeoutMs)
          )
        ]);
      };
      
      // Parse with timeout
      const pdfData = await parsePdfWithTimeout(buffer);
      
      if (!pdfData || typeof pdfData.text !== 'string') {
        throw new Error('Invalid PDF structure or empty content');
      }
      
      resumeText = pdfData.text;
      console.log('PDF parsed successfully, text length:', resumeText.length);
      
      if (!resumeText.trim()) {
        throw new Error('Extracted text is empty');
      }
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}` 
      }, { status: 400 });
    }

    // Simple resume validation to check if it's actually a resume
    console.log('Validating document content with basic checks...');
    const resumeKeywords = [
      'experience', 'education', 'skill', 'qualification', 'employment', 
      'job', 'work', 'position', 'resume', 'cv', 'curriculum', 'vitae', 
      'career', 'professional', 'objective', 'summary', 'university', 
      'degree', 'certification'
    ];
    
    const lowercaseText = resumeText.toLowerCase();
    const matchingKeywords = resumeKeywords.filter(keyword => lowercaseText.includes(keyword));
    
    console.log(`Resume validation: Found ${matchingKeywords.length} resume keywords`);
    
    // Only reject if almost no keywords match (very unlikely to be a resume)
    if (matchingKeywords.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'This document does not appear to be a resume or CV. Please upload a proper resume.',
        details: {
          foundKeywords: matchingKeywords,
          missingKeywords: resumeKeywords.filter(k => !matchingKeywords.includes(k))
        }
      }, { status: 400 });
    }

    console.log('Resume upload and validation successful:', file.name);

    return NextResponse.json({
      success: true,
      resumeText: resumeText.trim(),
      filename: file.name
    });

  } catch (error) {
    console.error('Error in resume upload API:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to process resume: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
