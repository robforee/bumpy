// src/app/page.js
import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
import { default as dynamicImport } from 'next/dynamic';

// Dynamically import ServerTime with no SSR
const ServerTime = dynamicImport(() => import('@/src/components/ServerTime'), { ssr: false });

// This line ensures the page is dynamically rendered on the server for each request
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
	const {firebaseServerApp} = await getAuthenticatedAppForUser();
	const restaurants = await getRestaurants(getFirestore(firebaseServerApp), searchParams);
	
	return (
		<main className="main__home">
			<h1>Welcome to Analyst Server</h1>
			<ServerTime />			
			<RestaurantListings
				initialRestaurants={restaurants}
				searchParams={searchParams}
			/>
		</main>
	);
}