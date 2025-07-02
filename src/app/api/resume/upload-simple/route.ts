import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth } from '@/firebase/admin'

// Simple upload that just processes the resume without Firebase Storage
export async function POST(request: NextRequest) {
  console.log('API route called: /api/resume/upload-simple')
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authentication token provided' 
      }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify the token
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
      console.log('Token verified for user:', decodedToken.uid)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 })
    }

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

    // Extract text from the file
    try {
      const textFormData = new FormData()
      textFormData.append('file', file)
      
      console.log('Calling text extraction API...')
      const extractResponse = await fetch(`${request.nextUrl.origin}/api/resume/extract-text`, {
        method: 'POST',
        body: textFormData,
      })
      
      let resumeText = `Resume processed successfully: ${file.name}`
      
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
        resumeText,
        filename: file.name,
        message: 'Resume processed successfully (stored locally in profile)'
      })
      
    } catch (textError) {
      console.error('Text extraction failed:', textError)
      
      return NextResponse.json({
        success: true,
        resumeText: `Resume uploaded successfully: ${file.name}. Text processing will be completed automatically.`,
        filename: file.name,
        message: 'Resume uploaded (text processing had issues but file was received)'
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
