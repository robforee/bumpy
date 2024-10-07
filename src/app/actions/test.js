// src/app/actions/test.js
"use server";

import { getFirestore, doc, setDoc, collection, getDoc } from "firebase/firestore";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { addReviewToRestaurant } from "@/src/lib/firebase/firestore";
import { getAdminAuth, getAdminFirestore } from '@/src/lib/firebase/adminApp';


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

// running on the server via route
export async function ServerWriteAsImpersonatedUser(idToken) {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    try {
        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        console.log('Verified UID:', uid);

        // Perform your Firestore operations here
        const docRef = db.collection('adminData').doc(uid);
        await docRef.set({
            message: "This was written from the server, impersonating the user",
            timestamp: new Date().toISOString()
        });

        console.log('Write operation completed successfully');
        return { success: true };
    } catch (error) {
        console.error('Error in ServerWriteAsImpersonatedUser:', error);
        // Don't expose detailed error messages to the client
        throw new Error('An error occurred while processing your request');
    }
}
