import Restaurant from "@/src/components/restaurant/Restaurant.jsx";
import { Suspense } from "react";
import { getRestaurantById } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser, getAuthenticatedAppForUser as getUser } from "@/src/lib/firebase/serverApp.js";

import { useUser } from '@/src/contexts/UserProvider';

import ReviewsList, {
  ReviewsListSkeleton,
} from "@/src/components/restaurant/Reviews/ReviewsList";
import {
  GeminiSummary,
  GeminiSummarySkeleton,
} from "@/src/components/restaurant/Reviews/ReviewSummary";
// console.log('GGG page import GeminiSummary, GeminiSummarySkeleton')
import { getFirestore } from "firebase/firestore";
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

export default async function Home({ params }) {
  const { user, loading } = useUser();
  if (!user) { return <div>Please sign in for access</div>; }
  if (loading) { return <div>Loading...</div>; }

  // This is a server component, we can access URL
	// parameters via Next.js and download the data
	// we need for this page
  const idToken = await getIdToken(auth.currentUser);
  const {firebaseServerApp, currentUser} = await getAuthenticatedAppForUser(idToken);
  const restaurant = await getRestaurantById(getFirestore(firebaseServerApp), params.id);

  return (
    <main className="main__restaurant">
      <Restaurant
        id={params.id}
        initialRestaurant={restaurant}
        initialUserId={currentUser?.uid || ""}
      >
        {/* <Suspense fallback={<GeminiSummarySkeleton />}>
          <GeminiSummary restaurantId={params.id} />
        </Suspense> */}
      </Restaurant>
      {/* <Suspense
        fallback={<ReviewsListSkeleton numReviews={restaurant.numRatings} />}
      >
        
      </Suspense> */}
      <ReviewsList restaurantId={params.id} userId={currentUser?.uid || ""} />
    </main>
  );
}
