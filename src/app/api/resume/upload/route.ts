import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import pdf from 'pdf-parse'
import { validateResumeContent } from '@/lib/resumeValidator'

export async function POST(request: NextRequest) {
  console.log('API route called: /api/resume/upload')
  
  try {
    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('resume') as File

    if (!file) {
      console.log('No file found in form data')
      return NextResponse.json({ 
        success: false, 
        error: 'No file uploaded' 
      }, { status: 400 })
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
          const pdfData = await pdf(buffer)
          resumeText = pdfData.text
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

      // Validate that the document is actually a resume/CV
      console.log('Validating document content...')
      try {
        const validation = await validateResumeContent(resumeText)
        console.log('Validation result:', validation)

        if (!validation.isResume) {
          return NextResponse.json({
            success: false,
            error: 'This document does not appear to be a resume or CV. Please upload a proper resume.',
            details: {
              documentType: validation.documentType,
              confidence: validation.confidence,
              reasons: validation.reasons,
              suggestions: validation.suggestions
            }
          }, { status: 400 })
        }

        // If confidence is low but still classified as resume, warn the user
        if (validation.confidence < 80) {
          console.log(`Low confidence resume validation: ${validation.confidence}%`)
        }

      } catch (validationError) {
        console.error('Resume validation error:', validationError)
        // If validation fails, we'll allow the upload but log the error
        console.log('Proceeding with upload despite validation error')
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
