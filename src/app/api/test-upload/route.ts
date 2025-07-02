import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint to verify upload functionality
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // Basic file validation
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

    // Just return file info without processing
    return NextResponse.json({
      success: true,
      message: 'File received successfully',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Test upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
