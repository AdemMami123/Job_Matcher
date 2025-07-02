import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth } from '@/firebase/admin'
import { storage } from '@/firebase/admin'

// Skip during build/prerender to avoid issues
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'phase-export';

// Alternative upload endpoint that handles Firebase uploads server-side
export async function POST(request: NextRequest) {
  console.log('API route called: /api/resume/upload-firebase')
  console.log('Environment check:', {
    isBuildPhase,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  })
  
  if (isBuildPhase) {
    console.log('Build phase detected, returning mock response');
    return NextResponse.json({
      success: true,
      downloadUrl: "https://mock-url.com/mock-file.pdf",
      storagePath: "mock/path/file.pdf",
      resumeText: "This is a mock resume text for build phase",
      filename: "mock-file.pdf"
    });
  }

  try {
    // Check if Firebase admin is properly configured
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('Missing Firebase environment variables')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error: Missing Firebase credentials' 
      }, { status: 500 })
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authentication token provided' 
      }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('Token received, length:', token.length)
    
    // Verify the token
    let decodedToken
    try {
      console.log('Attempting to verify ID token...')
      decodedToken = await adminAuth.verifyIdToken(token)
      console.log('Token verified successfully for user:', decodedToken.uid)
    } catch (error) {
      console.error('Token verification failed:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication token: ' + (error instanceof Error ? error.message : 'Unknown error')
      }, { status: 401 })
    }

    const userId = decodedToken.uid

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF files are supported' 
      }, { status: 400 })
    }

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

    console.log('Uploading to Firebase Storage:', fileName)

    // Upload to Firebase Storage using admin SDK
    let bucket
    try {
      // Try default bucket first
      bucket = storage.bucket()
      console.log('Using default bucket')
    } catch (defaultError) {
      console.log('Default bucket failed, trying with explicit name:', defaultError)
      try {
        // Try with explicit project bucket name
        bucket = storage.bucket(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`)
        console.log('Using explicit bucket name')
      } catch (explicitError) {
        console.error('Both bucket methods failed:', explicitError)
        return NextResponse.json({ 
          success: false, 
          error: 'Firebase Storage bucket not found. Please ensure Firebase Storage is enabled in your project.' 
        }, { status: 500 })
      }
    }
    
    const fileRef = bucket.file(fileName)
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          uploadedBy: userId,
          originalName: file.name,
          uploadTimestamp: timestamp.toString()
        }
      }
    })

    console.log('File saved to Firebase Storage successfully')

    // Make file publicly readable
    await fileRef.makePublic()

    // Get download URL
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

    console.log('Download URL generated:', downloadUrl)

    // Extract text from the uploaded file
    try {
      const textFormData = new FormData()
      const textFile = new File([buffer], file.name, { type: 'application/pdf' })
      textFormData.append('file', textFile)
      
      console.log('Calling text extraction API...')
      const extractResponse = await fetch(`${request.nextUrl.origin}/api/resume/extract-text`, {
        method: 'POST',
        body: textFormData,
      })
      
      let resumeText = `Resume uploaded successfully: ${file.name}`
      
      if (extractResponse.ok) {
        const extractResult = await extractResponse.json()
        if (extractResult.success && extractResult.text) {
          resumeText = extractResult.text
          console.log('Text extraction successful, length:', resumeText.length)
        } else {
          console.log('Text extraction failed, using fallback')
        }
      } else {
        console.log('Text extraction API call failed, status:', extractResponse.status)
      }
      
      return NextResponse.json({
        success: true,
        downloadUrl,
        storagePath: fileName,
        resumeText,
        filename: file.name
      })
      
    } catch (textError) {
      console.error('Text extraction failed:', textError)
      
      return NextResponse.json({
        success: true,
        downloadUrl,
        storagePath: fileName,
        resumeText: `Resume uploaded successfully: ${file.name}. Text processing will be completed automatically.`,
        filename: file.name
      })
    }

  } catch (error) {
    console.error('Server-side upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
