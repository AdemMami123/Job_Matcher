import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/firebase/admin'

export async function GET(request: NextRequest) {
  console.log('Testing Firebase Storage setup...')
  
  try {
    // Test different bucket configurations
    const projectId = process.env.FIREBASE_PROJECT_ID
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'No Firebase project ID found',
        projectId: null
      })
    }
    
    console.log('Testing with project ID:', projectId)
    
    // Try different bucket name patterns
    const bucketVariations = [
      projectId + '.appspot.com',
      projectId + '.firebasestorage.app',
      projectId,
      'gs://' + projectId + '.appspot.com',
      'gs://' + projectId + '.firebasestorage.app'
    ]
    
    const results = []
    
    for (const bucketName of bucketVariations) {
      try {
        console.log('Testing bucket:', bucketName)
        const bucket = storage.bucket(bucketName)
        const [exists] = await bucket.exists()
        
        results.push({
          bucketName,
          exists,
          error: null
        })
        
        if (exists) {
          console.log('Found working bucket:', bucketName)
          break
        }
      } catch (error) {
        console.log('Bucket test failed for', bucketName, ':', error)
        results.push({
          bucketName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Also try default bucket
    try {
      console.log('Testing default bucket...')
      const defaultBucket = storage.bucket()
      const [defaultExists] = await defaultBucket.exists()
      
      results.push({
        bucketName: 'default',
        exists: defaultExists,
        error: null
      })
    } catch (defaultError) {
      console.log('Default bucket test failed:', defaultError)
      results.push({
        bucketName: 'default',
        exists: false,
        error: defaultError instanceof Error ? defaultError.message : 'Unknown error'
      })
    }
    
    return NextResponse.json({
      success: true,
      projectId,
      bucketTests: results,
      recommendation: results.find(r => r.exists) ? 
        `Use bucket: ${results.find(r => r.exists)?.bucketName}` : 
        'No working bucket found. Enable Firebase Storage in your project console.'
    })
    
  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
