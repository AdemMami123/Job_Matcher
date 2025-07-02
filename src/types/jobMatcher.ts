// types/jobMatcher.ts
export interface CandidateProfile {
  name: string;
  currentRole: string;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  salaryRange: string;
  preferredRole: string;
  industry: string;
  achievements?: string[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobType: string;
  description: string;
}

export interface JobMatch {
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchLevel: string;
  matchReasons: {
    skillsMatch: number;
    experienceMatch: number;
    locationMatch: number;
    salaryMatch: number;
    cultureMatch: number;
  };
  pros: string[];
  cons: string[];
  requiredPreparation: string[];
  applicationStrategy: string;
}

export interface ProfileAnalysis {
  profileStrength: number;
  marketability: {
    score: number;
    assessment: string;
    competitiveAdvantages: string[];
  };
  skillAnalysis: {
    strongSkills: string[];
    skillGaps: string[];
    emergingSkills: string[];
    skillMarketValue: number;
  };
  careerRecommendations: {
    idealRoles: string[];
    alternativeRoles: string[];
    careerPath: string[];
    industryMatch: string[];
  };
  improvementAreas: {
    immediate: string[];
    longTerm: string[];
    certifications: string[];
  };
  salaryInsights: {
    marketRange: string;
    factors: string[];
    negotiationTips: string[];
  };
  jobSearchStrategy: {
    platforms: string[];
    networking: string[];
    applicationTips: string[];
  };
}

export interface ResumeOptimization {
  optimizedSections: {
    professionalSummary: string;
    keySkills: string[];
    experienceHighlights: string[];
    achievements: string[];
  };
  improvements: {
    keywordOptimization: string[];
    formatting: string[];
    contentGaps: string[];
    redundancies: string[];
  };
  atsOptimization: {
    score: number;
    improvements: string[];
    keywords: string[];
  };
  tailoringAdvice: {
    jobSpecific: string[];
    industrySpecific: string[];
    companySpecific: string[];
  };
  actionItems: Array<{
    priority: 'High' | 'Medium' | 'Low';
    action: string;
    impact: string;
  }>;
  beforeAfterComparison: {
    currentStrengths: string[];
    improvementImpact: string;
  };
}

export interface CoverLetter {
  coverLetter: string;
  sections: {
    opening: string;
    body: string;
    closing: string;
  };
  keyHighlights: string[];
  personalizationElements: string[];
  improvements: string[];
  alternativeVersions: {
    concise: string;
    detailed: string;
  };
}

export interface CoverLetterData {
  coverLetter: string;
  sections: {
    opening: string;
    body: string;
    closing: string;
  };
  keyHighlights: string[];
  keywordsUsed: string[];
  strengthsHighlighted: string[];
  suggestions: string[];
  alternativeVersions: {
    concise: string;
    detailed: string;
  };
  note?: string; // For fallback notice
}

export interface CareerPath {
  careerPath: {
    currentPosition: string;
    targetPosition: string;
    pathFeasibility: number;
    estimatedTimeframe: string;
  };
  milestones: Array<{
    phase: string;
    duration: string;
    objectives: string[];
    actions: string[];
    skillDevelopment: string[];
    possibleRoles: string[];
  }>;
  skillDevelopment: {
    criticalSkills: string[];
    niceTohaveSkills: string[];
    learningPath: string[];
    resources: string[];
  };
  networking: {
    targetContacts: string[];
    platforms: string[];
    events: string[];
    strategies: string[];
  };
  experienceGaps: {
    identified: string[];
    solutions: string[];
    alternatives: string[];
  };
  marketAnalysis: {
    demandTrend: string;
    salaryTrend: string;
    industryOutlook: string;
    competitiveFactors: string[];
  };
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  riskFactors: string[];
}

// User profile and stats interfaces
export interface UserStats {
  totalAnalyses: number;
  highestMatchScore: number;
  averageMatchScore: number;
  analysesThisMonth: number;
  analysesHistory: {
    id: string;
    date: string;
    jobTitle: string;
    companyName: string;
    jobCategory: string;
    score: number;
    strengths?: string[];
    weaknesses?: string[];
  }[];
  topStrengths: string[];
  commonWeaknesses: string[];
  improvementTrend: 'improving' | 'stable' | 'declining' | 'not-enough-data';
  lastActive: string;
}

export interface SavedResume {
  id: string;
  name: string;
  dateUploaded: string;
  content: string;
  fileSize: number;
  fileName: string;
  isDefault: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  profession?: string;
  careerLevel?: string;
  targetIndustry?: string;
  targetRole?: string;
  location?: string;
  bio?: string;
  skills: string[];
  savedResumes: SavedResume[];
  savedJobs: string[];
  savedSearches: {
    id: string;
    name: string;
    parameters: Record<string, any>;
    dateCreated: string;
  }[];
  preferences: {
    defaultResumeId?: string;
    jobAlerts: boolean;
    emailFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
    theme: 'dark' | 'light' | 'system';
    privateProfile: boolean;
  };
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
}

// Interface for profile update operations
export interface ProfileUpdatePayload {
  displayName?: string;
  photoURL?: string;
  profession?: string;
  careerLevel?: string;
  targetIndustry?: string;
  targetRole?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  preferences?: Partial<UserProfile['preferences']>;
}
