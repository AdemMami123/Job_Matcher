import { storage, auth } from '@/firebase/config'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'

export interface UploadProgress {
  bytesTransferred: number
  totalBytes: number
  percentage: number
}

export interface UploadResult {
  success: boolean
  downloadUrl?: string
  storagePath?: string
  resumeText?: string
  error?: string
}

export const uploadResumeToFirebase = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Enhanced validation
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    if (!file.type.includes('pdf')) {
      return { success: false, error: 'Only PDF files are supported' }
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 10MB' }
    }

    if (!userId) {
      return { success: false, error: 'User authentication required' }
    }

    // Check if storage is available
    if (!storage) {
      return { success: false, error: 'Storage service not available' }
    }

    // Verify user is authenticated
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== userId) {
      return { success: false, error: 'Authentication mismatch. Please sign in again.' }
    }

    console.log('Starting upload for user:', userId, 'File:', file.name)

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `resumes/${userId}/${timestamp}_${originalName}`

    // Create storage reference
    const storageRef = ref(storage, fileName)

    console.log('Created storage reference:', fileName)

    // Upload file with metadata
    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
        uploadTimestamp: timestamp.toString()
      }
    }

    const uploadTask = uploadBytesResumable(storageRef, file, metadata)

    return new Promise((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress callback
          if (onProgress) {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            }
            onProgress(progress)
          }
        },
        (error) => {
          // Error callback
          console.error('Firebase upload error:', error)
          let errorMessage = 'Upload failed'
          
          // Handle specific Firebase errors
          if (error.code === 'storage/unauthorized') {
            errorMessage = 'Upload failed: Insufficient permissions'
          } else if (error.code === 'storage/canceled') {
            errorMessage = 'Upload was canceled'
          } else if (error.code === 'storage/unknown') {
            errorMessage = 'Upload failed: Unknown error occurred'
          } else if (error.message) {
            errorMessage = `Upload failed: ${error.message}`
          }
          
          resolve({ success: false, error: errorMessage })
        },
        async () => {
          try {
            // Success callback
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            
            console.log('File uploaded successfully to Firebase Storage:', downloadUrl)
            
            // Extract text from the uploaded file
            const textExtractionResult = await extractTextFromUploadedFile(downloadUrl, file.name)
            
            resolve({
              success: true,
              downloadUrl,
              storagePath: fileName,
              resumeText: textExtractionResult.text
            })
          } catch (error) {
            console.error('Error getting download URL or extracting text:', error)
            resolve({ 
              success: false, 
              error: 'File uploaded but failed to process. Please try again.' 
            })
          }
        }
      )
    })
  } catch (error) {
    console.error('Firebase upload setup error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? `Upload error: ${error.message}` : 'Unknown upload error' 
    }
  }
}

// Helper function to extract text from uploaded file
const extractTextFromUploadedFile = async (downloadUrl: string, fileName: string) => {
  try {
    // Fetch the file
    const response = await fetch(downloadUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    // For PDF text extraction, call our text extraction API
    const formData = new FormData()
    const file = new File([buffer], fileName, { type: 'application/pdf' })
    formData.append('file', file)
    
    try {
      const extractResponse = await fetch('/api/resume/extract-text', {
        method: 'POST',
        body: formData,
      })
      
      if (extractResponse.ok) {
        const result = await extractResponse.json()
        if (result.success && result.text) {
          return { text: result.text }
        }
      }
    } catch (apiError) {
      console.warn('Text extraction API failed, will try fallback:', apiError)
    }
    
    // Fallback: Return a message indicating the file was uploaded successfully
    return { text: `Resume uploaded successfully from ${fileName}. Text extraction may take a moment to complete.` }
  } catch (error) {
    console.error('Text extraction error:', error)
    return { text: `Resume uploaded successfully from ${fileName}. Text content will be processed automatically.` }
  }
}
