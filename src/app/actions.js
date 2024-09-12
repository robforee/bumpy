// src/app/actions.js
"use server";

import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";

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
            rating: data.get("rating"),
            userId: data.get("userId"),
            userName: data.get("userName")
        });

        console.log('@@@ Review submitted successfully');
    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
}