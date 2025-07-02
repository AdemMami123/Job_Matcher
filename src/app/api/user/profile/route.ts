import { getCurrentUser } from '@/lib/actions/auth.action';
import { db } from '@/firebase/admin';
import { ProfileUpdatePayload, UserProfile } from '@/types/jobMatcher';

// GET: Fetch user profile
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return Response.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        // Get user profile from Firestore
        const profileDoc = await db.collection("userProfiles").doc(user.id).get();
        
        if (!profileDoc.exists) {
            // Create default profile if it doesn't exist
            const defaultProfile: UserProfile = {
                userId: user.id,
                displayName: user.name || '',
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

            await db.collection("userProfiles").doc(user.id).set(defaultProfile);
            return Response.json({ success: true, profile: defaultProfile }, { status: 200 });
        }

        return Response.json({
            success: true,
            profile: profileDoc.data()
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST: Update user profile
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return Response.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const payload = await request.json() as ProfileUpdatePayload;

        // Basic validation
        if (Object.keys(payload).length === 0) {
            return Response.json({
                success: false,
                error: 'No update data provided'
            }, { status: 400 });
        }

        // Add updated timestamp
        const updateData = {
            ...payload,
            updatedAt: new Date().toISOString()
        };

        // Update user profile in Firestore
        await db.collection("userProfiles").doc(user.id).update(updateData);

        return Response.json({
            success: true,
            message: 'Profile updated successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating profile:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
