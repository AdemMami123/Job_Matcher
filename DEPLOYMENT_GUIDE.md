# Vercel Deployment Guide for Smart Job Matcher

## Issue Resolution

The resume upload was failing on Vercel (HTTP 500 error) because:

1. **Serverless limitations**: PDF parsing with `pdf-parse` in serverless functions can exceed memory/time limits
2. **File storage**: Temporary file storage doesn't work reliably in serverless environments
3. **Dependencies**: Heavy dependencies can cause cold start issues

## Solution: Firebase Storage + Text Extraction API

Your app now uses Firebase Storage for file uploads, which is perfect for serverless deployments:

1. **Client uploads directly to Firebase Storage** (fast, reliable)
2. **Text extraction happens via separate API call** (smaller, focused serverless function)
3. **Fallback handling** if text extraction fails

## Steps to Deploy Successfully

### 1. Set up Firebase Environment Variables in Vercel

In your Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
GEMINI_API_KEY=your_gemini_key
```

### 2. Configure Firebase Storage Rules

Apply these rules in your Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{userId}/{resumeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Deploy to Vercel

```bash
# Build locally first to catch any issues
npm run build

# Deploy to Vercel
vercel --prod
```

## How the Fixed Upload Works

1. **User selects PDF file** → Client-side validation
2. **File uploads to Firebase Storage** → Progress tracking, error handling
3. **Get download URL** → Firebase provides secure URL
4. **Extract text via API** → `/api/resume/extract-text` processes the uploaded file
5. **Save to user profile** → Firestore stores resume metadata + text
6. **Update UI** → User sees success message and new resume in list

## Benefits of This Approach

✅ **Reliable on serverless platforms** (Vercel, Netlify, etc.)
✅ **Fast uploads** (direct to Firebase Storage)
✅ **Scalable** (Firebase handles file storage)
✅ **Secure** (Firebase Storage rules + authentication)
✅ **Progress tracking** (Real-time upload progress)
✅ **Graceful fallbacks** (Works even if text extraction fails)

## Troubleshooting

### If uploads still fail:

1. **Check Firebase rules** are correctly applied
2. **Verify environment variables** in Vercel dashboard
3. **Check Vercel function logs** for specific error messages
4. **Test text extraction API** independently using `/api/test-upload`

### Testing the upload:

```bash
# Test the basic upload functionality
curl -X POST https://your-app.vercel.app/api/test-upload \
  -F "file=@sample.pdf"

# Should return file info without processing
```

## Next Steps

1. Deploy with the current configuration
2. Test resume upload on the deployed version
3. Monitor Vercel function logs for any issues
4. Fine-tune text extraction timeouts if needed

The Firebase Storage approach eliminates the serverless limitations that were causing the 500 errors!
