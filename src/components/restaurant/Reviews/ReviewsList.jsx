// This component handles the list of reviews for a given restaurant

import React from "react";
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
import ReviewsListClient from "@/src/components/restaurant/Reviews/ReviewsListClient";
import { ReviewSkeleton } from "@/src/components/restaurant/Reviews/Review";
import { getFirestore } from "firebase/firestore";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";


export default async function ReviewsList({ restaurantId, userId }) {
  const idToken = await getIdToken(auth.currentUser);
  const {firebaseServerApp} = await getAuthenticatedAppForUser(idToken);
  const reviews = await getReviewsByRestaurantId(getFirestore(firebaseServerApp), restaurantId);
  console.log('%%% Reviews',reviews.length)
  
  return (
    <ReviewsListClient
      initialReviews={reviews}
      restaurantId={restaurantId}
      userId={userId}
    />
  );
}

export function ReviewsListSkeleton({ numReviews }) {
  return (
    <article>
      <ul className="reviews">
        <ul>
          {Array(numReviews)
            .fill(0)
            .map((value, index) => (
              <ReviewSkeleton key={`loading-review-${index}`} />
            ))}
        </ul>
      </ul>
    </article>
  );
}
