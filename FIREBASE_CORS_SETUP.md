# Firebase Storage CORS Configuration Guide

## Problem
Firebase Storage has CORS restrictions that prevent uploads from web applications by default.

## Solution Steps

### Method 1: Using Google Cloud Console (Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to Cloud Storage > Browser
4. Find your Firebase Storage bucket (should be named like `your-project.appspot.com`)
5. Click on the bucket name
6. Go to the "Permissions" tab
7. Click "Grant Access"
8. Add these permissions:
   - Principal: `allUsers`
   - Role: `Storage Object Viewer` (for public read)
   - Principal: `allAuthenticatedUsers` 
   - Role: `Storage Object Admin` (for authenticated writes)

### Method 2: Using gsutil (Command Line)

If you have Google Cloud SDK installed:

```bash
# Install Google Cloud SDK first if you haven't
# Then authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Apply CORS configuration
gsutil cors set cors.json gs://YOUR_BUCKET_NAME
```

Replace `YOUR_PROJECT_ID` and `YOUR_BUCKET_NAME` with your actual values.

### Method 3: Temporary Development Fix

For development only, you can temporarily disable CORS in your browser:

**Chrome/Edge:**
```bash
# Close all browser instances first, then run:
chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security --disable-features=VizDisplayCompositor
```

**Note:** This is only for development and testing!

### Method 4: Firebase Storage Rules (Update Required)

Make sure your Firebase Storage rules allow authenticated uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Verify Configuration

After setting up CORS, test your upload functionality:

1. Open browser developer tools
2. Try uploading a resume
3. Check the Network tab for successful Firebase Storage requests
4. Look for `200 OK` responses instead of CORS errors

## Common Issues

- **Still getting CORS errors?** Wait 5-10 minutes for CORS changes to propagate
- **Authentication errors?** Make sure user is signed in before uploading
- **Storage rules errors?** Check Firebase Console > Storage > Rules for any syntax errors

## Your Bucket Information

Based on your error message, your bucket appears to be: `job-matcher-619a4.appspot.com`

Apply the CORS configuration to this specific bucket.
