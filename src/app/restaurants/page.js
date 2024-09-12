// src/app/restaurants/page.js
import RestaurantListings from "@/src/components/restaurant/RestaurantListings";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export default async function RestaurantsPage({ searchParams }) {
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  const restaurants = await getRestaurants(getFirestore(firebaseServerApp), searchParams);
  
  return (
    <main className="main__restaurants">
      <h1>Restaurant Listings</h1>
      <RestaurantListings
        initialRestaurants={restaurants}
        searchParams={searchParams}
      />
    </main>
  );
}