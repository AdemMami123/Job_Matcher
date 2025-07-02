export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  currentRole?: string;
  experience?: number;
  skills?: string[];
  location?: string;
  industry?: string;
  preferredJobType?: string;
  defaultResume?: {
    filename: string;
    uploadedAt: string;
    resumeText: string;
  };
  stats: UserStats;
}

export interface UserStats {
  totalAnalyses: number;
  totalUploads: number;
  coverLettersGenerated: number;
  lastActiveDate: string;
  averageMatchScore: number;
  topMatchedKeywords: string[];
  analysisHistory: AnalysisRecord[];
}

export interface AnalysisRecord {
  id: string;
  date: string;
  jobTitle: string;
  company?: string;
  matchScore: number;
  resumeUsed: string; // filename
}

export interface MatchAnalysis {
  overallMatch: number;
  scores: {
    technicalSkills: number;
    experienceMatch: number;
    keywordAlignment: number;
    softSkills: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: {
    category: string;
    original: string;
    improved: string;
    reason: string;
  }[];
  missingKeywords: string[];
  matchedKeywords: string[];
  note?: string; // Optional note for mock analysis
}
