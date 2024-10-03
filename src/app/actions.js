// src/app/actions.js
"use server";

import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import { getAuthenticatedAppForUser }            from "@/src/lib/firebase/serverApp";
import { addReviewToRestaurant }                 from "@/src/lib/firebase/firestore";

import { getAdminAuth, getAdminFirestore }       from '@/src/lib/firebase/adminApp';


export async function handleReviewFormSubmission(data) {

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();

        const db = getFirestore(firebaseServerApp);
        await addReviewToRestaurant(db, data.get("restaurantId"), {
            text: data.get("text"),
            rating: 5,
            userId: data.get("userId"),
            userName: data.get("userName")
        });

    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
}

export async function writeReviewServerSide(restaurantId, review) {

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();
        const db = getFirestore(firebaseServerApp);

        await addReviewToRestaurant(db, restaurantId, review);

        return { success: true };
    } catch (error) {
        console.error("Error submitting review from server-side:", error);
        throw error;
    }
}

export async function writeToUserOwnedPath(userId, rating) {

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();
        const db = getFirestore(firebaseServerApp);

        const ratingId = `rating_${Date.now()}`; // Generate a unique ID for the rating
        const ratingRef = doc(collection(db, 'users', userId, 'ratings'), ratingId);

        await setDoc(ratingRef, rating);

        return { success: true };
    } catch (error) {
        console.error("Error submitting rating to user-owned path:", error);
        throw error;
    }
}

export async function ServerWriteWithServiceAccount() {
  const db = getAdminFirestore();
  const docRef = db.collection('adminData').doc('testDoc');
  await docRef.set({
    message: "This was written with service account permissions",
    timestamp: new Date().toISOString()
  });
  return { success: true };
}

export async function ServerWriteAsImpersonatedUser(idToken) {

    try {
        const adminAuth = getAdminAuth();

        const decodedToken = await adminAuth.verifyIdToken(idToken);

        const db = getAdminFirestore();

        const docRef = db.collection('users').doc(decodedToken.uid).collection('serverData').doc('testDoc');
        
        await docRef.set({
            message: "This was written from the server, impersonating the user",
            timestamp: new Date().toISOString()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error in writeAsUser:', error);
        if (error.code === 'auth/argument-error') {
            console.error('Invalid ID token provided');
        }
        throw error;
    }
}