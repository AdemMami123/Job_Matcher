"use server";

import { db } from "@/firebase/admin";
import { getCurrentUser } from "./auth.action";
import { SavedResume, UserProfile, ProfileUpdatePayload } from "@/types/jobMatcher";
import { revalidatePath } from "next/cache";

/**
 * Get the complete user profile with saved resumes and stats
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log("getUserProfile: No authenticated user found");
      return null;
    }

    console.log("getUserProfile: Got user", user.id, user.name);

    // Get user profile from Firestore
    const profileDoc = await db.collection("userProfiles").doc(user.id).get();
    
    if (!profileDoc.exists) {
      console.log("getUserProfile: No profile exists, creating default profile for", user.id);
      
      // Create default profile if it doesn't exist
      const defaultProfile: UserProfile = {
        userId: user.id,
        displayName: user.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: "",
        skills: [],
        savedResumes: [],
        savedJobs: [],
        savedSearches: [],
        preferences: {
          jobAlerts: true,
          emailFrequency: "weekly",
          theme: "dark",
          privateProfile: false
        },
        stats: {
          totalAnalyses: 0,
          highestMatchScore: 0,
          averageMatchScore: 0,
          analysesThisMonth: 0,
          analysesHistory: [],
          topStrengths: [],
          commonWeaknesses: [],
          improvementTrend: "not-enough-data",
          lastActive: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await db.collection("userProfiles").doc(user.id).set(defaultProfile);
        console.log("getUserProfile: Default profile created successfully for", user.id);
        return defaultProfile;
      } catch (dbError) {
        console.error("getUserProfile: Error creating default profile:", dbError);
        throw dbError;
      }
    }

    const profileData = profileDoc.data() as UserProfile;
    console.log("getUserProfile: Found existing profile for", user.id);
    return profileData;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(data: ProfileUpdatePayload): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await db.collection("userProfiles").doc(user.id).update(updateData);
    
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update profile" 
    };
  }
}

/**
 * Save a resume to the user profile
 */
export async function saveResume(resumeData: Omit<SavedResume, "id" | "dateUploaded">): Promise<{ success: boolean; resumeId?: string; error?: string }> {
  // Skip during build/prerender
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NEXT_PHASE === 'phase-export') {
    console.log('Build/export mode detected in saveResume, returning mock success');
    return { success: true, resumeId: 'build-mock-id' };
  }
  
  console.log('Starting saveResume with data:', {
    name: resumeData.name,
    fileName: resumeData.fileName,
    fileSize: resumeData.fileSize,
    isDefault: resumeData.isDefault,
    contentLength: resumeData.content?.length || 0
  });
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('saveResume: No authenticated user found');
      return { success: false, error: "Not authenticated" };
    }
    console.log('saveResume: User found', user.id);

    // Create a resume document with validation
    const resumeId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Validate resume data
    if (!resumeData.content) {
      return { success: false, error: "Resume content is missing" };
    }
    
    if (resumeData.content.length < 100) {
      return { success: false, error: "Resume content is too short or incomplete" };
    }
    
    const resume: SavedResume = {
      ...resumeData,
      id: resumeId,
      dateUploaded: new Date().toISOString(),
    };

    // Get user profile
    const profileRef = db.collection("userProfiles").doc(user.id);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      console.log('saveResume: User profile not found');
      return { success: false, error: "User profile not found" };
    }
    console.log('saveResume: Profile found, updating...');
    
    // Add resume to saved resumes array using a different approach
    try {
      // Get current data first
      const profileData = profileDoc.data() as Record<string, any>;
      const currentResumes = profileData.savedResumes || [];
      
      // Update with push instead of arrayUnion
      await profileRef.update({
        savedResumes: [...currentResumes, resume],
        updatedAt: new Date().toISOString()
      });
      
      console.log('saveResume: Resume added to profile');
    } catch (updateError) {
      console.error('saveResume: Error updating profile:', updateError);
      return { success: false, error: "Failed to save resume to profile" };
    }

    // If this is the first resume or isDefault is true, set it as default
    const profile = profileDoc.data() as UserProfile;
    if (resume.isDefault || profile.savedResumes.length === 0) {
      await profileRef.update({
        "preferences.defaultResumeId": resumeId
      });
    }

    revalidatePath("/profile");
    
    return { success: true, resumeId };
  } catch (error) {
    console.error("Error saving resume:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save resume" 
    };
  }
}

/**
 * Delete a saved resume
 */
export async function deleteResume(resumeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user profile
    const profileRef = db.collection("userProfiles").doc(user.id);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      return { success: false, error: "User profile not found" };
    }
    
    const profile = profileDoc.data() as UserProfile;
    
    // Remove resume from saved resumes
    const updatedResumes = profile.savedResumes.filter(resume => resume.id !== resumeId);
    
    await profileRef.update({
      savedResumes: updatedResumes,
      updatedAt: new Date().toISOString()
    });

    // If the deleted resume was the default resume, update default resume id
    if (profile.preferences.defaultResumeId === resumeId) {
      const newDefaultId = updatedResumes.length > 0 ? updatedResumes[0].id : undefined;
      await profileRef.update({
        "preferences.defaultResumeId": newDefaultId || null
      });
    }

    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting resume:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete resume" 
    };
  }
}

/**
 * Set a resume as default
 */
export async function setDefaultResume(resumeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update default resume in profile preferences
    await db.collection("userProfiles").doc(user.id).update({
      "preferences.defaultResumeId": resumeId,
      updatedAt: new Date().toISOString()
    });

    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error setting default resume:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to set default resume" 
    };
  }
}

/**
 * Track a new analysis in user stats
 */
export async function trackAnalysis(
  jobTitle: string, 
  score: number, 
  companyName?: string, 
  jobCategory?: string, 
  strengths?: string[],
  weaknesses?: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(`Tracking analysis: ${jobTitle} - ${score}% - ${companyName || 'N/A'} - ${jobCategory || 'N/A'}`);
  console.log('Strengths:', strengths);
  console.log('Weaknesses:', weaknesses);
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('trackAnalysis: No authenticated user found');
      return { success: false, error: "Not authenticated" };
    }

    const profileRef = db.collection("userProfiles").doc(user.id);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      return { success: false, error: "User profile not found" };
    }
    
    const profile = profileDoc.data() as UserProfile;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Create enhanced analysis entry with additional details
    const newAnalysisEntry = {
      date: now.toISOString(),
      jobTitle,
      companyName: companyName || 'Not specified',
      jobCategory: jobCategory || 'Not specified',
      score,
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    
    // Add new entry to history
    const analysesHistory = [...profile.stats.analysesHistory, newAnalysisEntry];
    
    // Limit history to last 50 entries
    if (analysesHistory.length > 50) {
      analysesHistory.shift(); // Remove oldest entry
    }
    
    // Calculate this month's analyses
    const analysesThisMonth = analysesHistory.filter(analysis => {
      const date = new Date(analysis.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    // Calculate average score
    const totalScore = analysesHistory.reduce((sum, analysis) => sum + analysis.score, 0);
    const averageScore = analysesHistory.length > 0 ? totalScore / analysesHistory.length : 0;
    
    // Calculate highest score
    const highestScore = Math.max(profile.stats.highestMatchScore, score);
    
    // Calculate improvement trend
    let improvementTrend: UserProfile["stats"]["improvementTrend"] = "not-enough-data";
    if (analysesHistory.length >= 3) {
      const recentScores = analysesHistory.slice(-3).map(a => a.score);
      const isImproving = recentScores[2] > recentScores[1] && recentScores[1] >= recentScores[0];
      const isDeclining = recentScores[2] < recentScores[1] && recentScores[1] <= recentScores[0];
      
      if (isImproving) improvementTrend = "improving";
      else if (isDeclining) improvementTrend = "declining";
      else improvementTrend = "stable";
    }
    
    // Identify and update top strengths
    let topStrengths = profile.stats.topStrengths || [];
    if (strengths && strengths.length) {
      // Count occurrences of each strength
      const strengthCounts = new Map<string, number>();
      
      // Count existing strengths
      topStrengths.forEach(strength => {
        strengthCounts.set(strength, (strengthCounts.get(strength) || 0) + 1);
      });
      
      // Add new strengths from this analysis
      strengths.forEach(strength => {
        strengthCounts.set(strength, (strengthCounts.get(strength) || 0) + 1);
      });
      
      // Convert to array, sort by count, and take top 10
      topStrengths = Array.from(strengthCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => entry[0]);
    }
    
    // Identify and update common weaknesses
    let commonWeaknesses = profile.stats.commonWeaknesses || [];
    if (weaknesses && weaknesses.length) {
      // Count occurrences of each weakness
      const weaknessCounts = new Map<string, number>();
      
      // Count existing weaknesses
      commonWeaknesses.forEach(weakness => {
        weaknessCounts.set(weakness, (weaknessCounts.get(weakness) || 0) + 1);
      });
      
      // Add new weaknesses from this analysis
      weaknesses.forEach(weakness => {
        weaknessCounts.set(weakness, (weaknessCounts.get(weakness) || 0) + 1);
      });
      
      // Convert to array, sort by count, and take top 10
      commonWeaknesses = Array.from(weaknessCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => entry[0]);
    }
    
    // Update user stats
    await profileRef.update({
      stats: {
        ...profile.stats,
        totalAnalyses: profile.stats.totalAnalyses + 1,
        highestMatchScore: highestScore,
        averageMatchScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
        analysesThisMonth,
        analysesHistory,
        topStrengths,
        commonWeaknesses,
        improvementTrend,
        lastActive: now.toISOString()
      },
      updatedAt: now.toISOString()
    });
    
    console.log('Analysis tracked successfully. Stats updated:', {
      totalAnalyses: profile.stats.totalAnalyses + 1,
      highestScore: highestScore,
      averageScore: Math.round(averageScore * 10) / 10
    });
    
    // Revalidate the profile page to refresh the data
    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error tracking analysis:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to track analysis" 
    };
  }
}
