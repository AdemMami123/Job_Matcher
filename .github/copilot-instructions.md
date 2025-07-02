# Smart Job Matcher - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js TypeScript project for an AI-powered job matching application with the following characteristics:

## Project Overview
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication with session cookies
- **Database**: Firebase Firestore
- **AI Integration**: Google Gemini AI for resume analysis
- **File Processing**: PDF parsing for resume uploads

## Key Technologies
- Firebase (client & admin SDK)
- Google Gemini AI for resume-job matching
- PDF parsing for resume analysis
- Chart.js for data visualization
- React Dropzone for file uploads

## Architecture Patterns
- Server Actions for backend operations
- Protected routes with middleware
- Session-based authentication
- API routes for external integrations
- Component-based UI architecture

## Code Standards
- Use TypeScript strictly with proper type definitions
- Follow Next.js App Router conventions
- Implement proper error handling and validation
- Use Firebase security rules and admin SDK for server operations
- Maintain separation between client and server Firebase configurations
- Use Tailwind CSS for styling with responsive design principles

## Security Considerations
- Always validate user input
- Use Firebase Admin SDK for server-side operations
- Implement proper session management
- Sanitize file uploads and validate file types
- Use environment variables for sensitive data
