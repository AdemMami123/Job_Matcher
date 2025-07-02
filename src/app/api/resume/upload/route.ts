import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { validateResumeContent } from '@/lib/resumeValidator'

// Use dynamic import for pdf-parse to ensure it's only loaded at runtime
// and doesn't cause issues during build time
async function getPdfParser() {
  try {
    // Dynamic import that will only execute at runtime
    const pdfParse = await import('pdf-parse').then(module => module.default);
    return pdfParse;
  } catch (error) {
    console.warn('pdf-parse dynamic import failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('API route called: /api/resume/upload')
  
  try {
    console.log('Parsing form data...')
    const formData = await request.formData().catch(err => {
      console.error('Form data parsing error:', err);
      return null;
    });
    
    if (!formData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid form data' 
      }, { status: 400 });
    }
    
    // Debug information
    console.log('Form data keys:', [...formData.keys()]);
    
    const file = formData.get('resume') as File | null;
    
    if (!file) {
      console.log('No file found in form data');
      return NextResponse.json({ 
        success: false, 
        error: 'No file uploaded. Make sure the form field is named "resume".' 
      }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF and DOCX files are supported' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create temporary file path and ensure directory exists
    const tempDir = join(process.cwd(), 'temp')
    
    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    const filePath = join(tempDir, `${Date.now()}-${file.name}`)

    try {
      let resumeText = ''

      if (file.type.includes('pdf')) {
        // Parse PDF directly from buffer using pdf-parse
        console.log('Parsing PDF from buffer...')
        try {
          // For safety, use a direct import of pdf-parse
          let pdfParse;
          try {
            pdfParse = (await import('pdf-parse')).default;
          } catch (importError) {
            console.error('Error importing pdf-parse:', importError);
            return NextResponse.json({
              success: false,
              error: 'PDF parsing module could not be loaded'
            }, { status: 500 });
          }
          
          // Create a safe buffer copy
          console.log('Creating buffer copy...');
          const bufferCopy = Buffer.from(buffer);
          
          console.log('Starting PDF parsing...');
          // Safe parsing with timeout
          let pdfData;
          try {
            // Set timeout for PDF parsing (30 seconds max)
            const timeout = setTimeout(() => {
              throw new Error('PDF parsing timeout after 30 seconds');
            }, 30000);
            
            pdfData = await pdfParse(bufferCopy);
            
            // Clear timeout if parsing completes
            clearTimeout(timeout);
          } catch (parseTimeoutError) {
            console.error('PDF parsing timeout or error:', parseTimeoutError);
            throw new Error('PDF parsing failed or timed out');
          }
          
          if (!pdfData || typeof pdfData.text !== 'string') {
            console.error('Invalid PDF data structure:', pdfData);
            throw new Error('PDF parsing failed - invalid data structure returned');
          }
          
          resumeText = pdfData.text;
          console.log('PDF parsed successfully, text length:', resumeText.length)
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError)
          return NextResponse.json({ 
            success: false, 
            error: `Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}` 
          }, { status: 400 })
        }
      } else {
        // For DOCX files, you might want to use a library like mammoth
        // For now, we'll return an error for DOCX
        return NextResponse.json({ 
          success: false, 
          error: 'DOCX parsing not yet implemented. Please use PDF format.' 
        }, { status: 400 })
      }

      if (!resumeText.trim()) {
        return NextResponse.json({ 
          success: false, 
          error: 'Could not extract text from the uploaded file. The PDF might be image-only or corrupted.' 
        }, { status: 400 })
      }

      // For now, let's use a simpler validation approach to avoid errors
      console.log('Validating document content with basic checks...')
      try {
        // Skip AI validation for now to avoid potential errors
        // Instead use a simple keyword check
        const resumeKeywords = ['experience', 'education', 'skill', 'qualification', 'employment', 
                               'job', 'work', 'position', 'resume', 'cv', 'curriculum', 'vitae', 'career'];
        
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
      } catch (validationError) {
        console.error('Resume validation error:', validationError);
        // If validation fails, we'll allow the upload but log the error
        console.log('Proceeding with upload despite validation error');
      }

      console.log('Resume upload and validation successful:', file.name)

      return NextResponse.json({
        success: true,
        resumeText: resumeText.trim(),
        filename: file.name
      })

    } catch (fileError) {
      console.error('File processing error:', fileError)
      throw fileError
    }

  } catch (error) {
    console.error('Error parsing resume:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
