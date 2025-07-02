import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/firebase/admin'
import { auth } from '@/firebase/admin'

export async function POST(request: NextRequest) {
  console.log('API route called: /api/resume/upload-v2')
  
  try {
    // Get the session token from cookies
    const sessionCookie = request.cookies.get('session')?.value
    
    if (!sessionCookie) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Verify the session
    let decodedToken
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true)
    } catch (authError) {
      console.error('Auth verification error:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication' 
      }, { status: 401 })
    }

    const userId = decodedToken.uid
    console.log('Authenticated user:', userId)

    // Parse form data
    let formData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error('Form data parsing error:', formError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse form data' 
      }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    
    if (!file) {
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
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files are supported' 
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

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `resumes/${userId}/${timestamp}_${originalName}`

    try {
      // Upload to Firebase Storage
      const bucket = storage.bucket()
      const fileRef = bucket.file(fileName)
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          }
        }
      })

      console.log('File uploaded to Firebase Storage:', fileName)

      // Generate a signed URL for the uploaded file (optional, for download)
      const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000 // 1 hour
      })

      // Try to extract text using pdf-parse (with better error handling)
      let resumeText = ''
      try {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        resumeText = pdfData.text
        
        if (!resumeText.trim()) {
          throw new Error('Extracted text is empty')
        }
        
        console.log('PDF text extracted successfully, length:', resumeText.length)
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        
        // For production, we'll still save the file but indicate parsing failed
        resumeText = `[PDF text extraction failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}]`
      }

      // Basic resume validation
      const resumeKeywords = [
        'experience', 'education', 'skill', 'qualification', 'employment', 
        'job', 'work', 'position', 'resume', 'cv', 'curriculum', 'vitae', 
        'career', 'professional', 'objective', 'summary', 'university', 
        'degree', 'certification'
      ]
      
      const lowercaseText = resumeText.toLowerCase()
      const matchingKeywords = resumeKeywords.filter(keyword => lowercaseText.includes(keyword))
      
      // Only warn if almost no keywords match, but don't reject
      if (matchingKeywords.length < 2 && !resumeText.includes('[PDF text extraction failed')) {
        console.warn(`Low resume keyword match: ${matchingKeywords.length} keywords found`)
      }

      return NextResponse.json({
        success: true,
        resumeText: resumeText.trim(),
        filename: file.name,
        storageUrl: downloadUrl,
        storagePath: fileName
      })

    } catch (storageError) {
      console.error('Firebase Storage error:', storageError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload file to storage' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in resume upload API:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to process resume: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
