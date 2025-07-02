import { getApps } from "firebase-admin/app"
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Skip during build/prerender to avoid issues
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'phase-export' ||
                     !process.env.FIREBASE_PROJECT_ID;

const initFirebaseAdmin = () => {
    if (isBuildPhase) {
        console.log('Build phase detected or missing Firebase config, using mock admin SDK');
        return {
            auth: {
                verifyIdToken: async () => ({ uid: 'mock-user' }),
                createCustomToken: async () => 'mock-token',
            },
            db: {
                collection: () => ({
                    doc: () => ({
                        get: async () => ({ exists: false }),
                        set: async () => {},
                        update: async () => {},
                    })
                })
            },
            storage: {
                bucket: () => ({
                    file: () => ({
                        save: async () => {},
                        getSignedUrl: async () => ['https://mock-url.com']
                    })
                })
            }
        } as any;
    }

    const apps = getApps();
    if (!apps.length) {
        try {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
                storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
            })
        } catch (error) {
            console.error('Firebase Admin initialization failed:', error);
            throw error;
        }
    }

    return {
        auth: getAuth(),
        db: getFirestore(),
        storage: getStorage(),
    }
}

export const { auth, db, storage } = initFirebaseAdmin();
