# Smart Job Matcher - AI-Powered Resume Analysis

A full-stack AI-powered web application that compares a user's resume against job descriptions using ### **AI Integration**
- Google Gemini AI for intelligent analysis
- Structured prompts for consistent scoring
- JSON response parsing for data visualization
- Error handling and fallbacksike logic. The platform scores compatibility, highlights strengths/weaknesses, and offers AI-generated suggestions to improve resumes.

## 🚀 Features

- **Resume Upload & Parsing**: Upload PDF resumes with automatic text extraction
- **AI-Powered Analysis**: Google Gemini AI integration for intelligent resume-job matching
- **Detailed Scoring**: Get scores for technical skills, experience, keywords, and soft skills
- **Visual Analytics**: Interactive charts showing match distribution and scores
- **AI Suggestions**: Specific recommendations to improve resume sections
- **Text-to-Speech**: Accessibility feature to read feedback aloud
- **User Authentication**: Secure Firebase Authentication with session management
- **Responsive Design**: Modern UI built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Chart.js & React-Chart.js-2** for data visualization
- **React Dropzone** for file uploads

### Backend
- **Next.js API Routes** for backend logic
- **Firebase Admin SDK** for server-side operations
- **Google Gemini AI** for resume analysis
- **PDF-Parse** for resume text extraction

### Authentication & Database
- **Firebase Authentication** with session cookies
- **Firebase Firestore** for user data storage

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Firebase project set up
- A Google AI API key

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd job_matcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore Database
   - Generate a service account key (for Admin SDK)
   - Get your web app configuration

4. **Set up Google AI**
   - Get an API key from [Google AI Studio](https://aistudio.google.com/)

5. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Admin SDK
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Firebase Client SDK
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Google AI API
   GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── layout.tsx
│   ├── (protected)/         # Protected pages
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/                 # API routes
│   │   ├── match/
│   │   ├── resume/
│   │   └── user/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/              # React components
│   ├── FeedbackSection.tsx
│   ├── JobDescriptionForm.tsx
│   ├── MatchAnalyzer.tsx
│   ├── MatchScoreCard.tsx
│   ├── Navbar.tsx
│   └── ResumeUploader.tsx
├── firebase/                # Firebase configuration
│   ├── admin.ts
│   └── config.ts
├── lib/
│   └── actions/
│       └── auth.action.ts   # Server actions
└── types/
    └── auth.ts              # TypeScript types
```

## 🔑 Key Features Explained

### Resume Analysis Process
1. User uploads a PDF resume
2. PDF-parse extracts text content
3. OpenAI GPT-4 analyzes resume against job description
4. System provides:
   - Overall match percentage
   - Detailed category scores
   - Specific improvement suggestions
   - Missing vs matched keywords

### Authentication Flow
1. Firebase Authentication for user management
2. Session cookies for server-side authentication
3. Protected routes with middleware
4. Automatic redirect based on auth status

### AI Integration
- OpenAI GPT-4 for intelligent analysis
- Structured prompts for consistent scoring
- JSON response parsing for data visualization
- Error handling and fallbacks

## 🎨 UI Components

- **ResumeUploader**: Drag-and-drop file upload with PDF parsing
- **JobDescriptionForm**: Text area for job posting input
- **MatchScoreCard**: Visual score display with charts
- **FeedbackSection**: AI suggestions with text-to-speech
- **MatchAnalyzer**: Main component orchestrating the analysis

## 🔊 Accessibility Features

- **Text-to-Speech**: Web Speech API integration
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Color choices optimized for visibility

## 🚀 Deployment

This project can be deployed to Vercel, Netlify, or any other Next.js hosting platform:

1. **Environment Variables**: Set up all required environment variables
2. **Build**: Run `npm run build` to create production build
3. **Deploy**: Follow your hosting platform's deployment guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

## 🙏 Acknowledgments

- Google AI for providing the Gemini API
- Firebase for authentication and database services
- The Next.js team for the excellent framework
- Chart.js for data visualization capabilities
