import { NextRequest, NextResponse } from 'next/server'
import { auth as adminAuth } from '@/firebase/admin'

// Test endpoint to verify authentication tokens
export async function POST(request: NextRequest) {
  console.log('API route called: /api/auth/verify')
  
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
    console.log('Token preview:', token.substring(0, 50) + '...')
    
    // Verify the token
    try {
      console.log('Attempting to verify ID token...')
      const decodedToken = await adminAuth.verifyIdToken(token)
      console.log('Token verified successfully for user:', decodedToken.uid)
      
      return NextResponse.json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
          expiresAt: new Date(decodedToken.exp * 1000).toISOString()
        }
      })
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
  } catch (error) {
    console.error('General error in auth verification:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
