// src/app/actions.js
"use server";

import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import { getAuthenticatedAppForUser }            from "@/src/lib/firebase/serverApp";
import { addReviewToRestaurant }                 from "@/src/lib/firebase/firestore";

import { getAdminAuth, getAdminFirestore }       from '@/src/lib/firebase/adminApp';


export async function handleReviewFormSubmission(data) {
    console.log('@@@ SERVER ~ handleReviewFormSubmission 3', {
        text: data.get("text"),
        rating: data.get("rating"),
        userId: data.get("userId"),
        userName: data.get("userName")
    });

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();

        const db = getFirestore(firebaseServerApp);
        await addReviewToRestaurant(db, data.get("restaurantId"), {
            text: data.get("text"),
            rating: 5,
            userId: data.get("userId"),
            userName: data.get("userName")
        });

        console.log('@@@ Review submitted successfully');
    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
}

export async function writeReviewServerSide(restaurantId, review) {
    console.log('@@@ SERVER ~ writeReviewServerSide', { restaurantId, review });

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();
        const db = getFirestore(firebaseServerApp);

        await addReviewToRestaurant(db, restaurantId, review);

        console.log('@@@ Review submitted successfully from server-side');
        return { success: true };
    } catch (error) {
        console.error("Error submitting review from server-side:", error);
        throw error;
    }
}

export async function writeToUserOwnedPath(userId, rating) {
    console.log('@@@ SERVER ~ writeToUserOwnedPath', { userId, rating });

    try {
        const { firebaseServerApp } = await getAuthenticatedAppForUser();
        const db = getFirestore(firebaseServerApp);

        const ratingId = `rating_${Date.now()}`; // Generate a unique ID for the rating
        const ratingRef = doc(collection(db, 'users', userId, 'ratings'), ratingId);

        await setDoc(ratingRef, rating);

        console.log('@@@ Rating submitted successfully to user-owned path');
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

export async function serverWriteAsImpersonatedUser(idToken) {
    console.log('@@@ SERVER ~ writeAsUser started', { idTokenLength: idToken?.length || 0 });

    try {
        const adminAuth = getAdminAuth();
        console.log('@@@ Admin Auth obtained');

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        console.log('@@@ Token verified', { uid: decodedToken.uid });

        const db = getAdminFirestore();
        console.log('@@@ Admin Firestore obtained');

        const docRef = db.collection('users').doc(decodedToken.uid).collection('serverData').doc('testDoc');
        
        await docRef.set({
            message: "This was written from the server, impersonating the user",
            timestamp: new Date().toISOString()
        });
        
        console.log('@@@ Document written successfully in writeAsUser');
        return { success: true };
    } catch (error) {
        console.error('Error in writeAsUser:', error);
        if (error.code === 'auth/argument-error') {
            console.error('Invalid ID token provided');
        }
        throw error;
    }
}