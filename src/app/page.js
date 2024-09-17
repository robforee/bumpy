// src/app/page.js
// a server render
import RestaurantListings from "@/src/components/restaurant/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
import { default as dynamicImport } from 'next/dynamic';
import AdminPage from "./admin/page";


// Dynamically import ServerTime with no SSR
const ServerTime = dynamicImport(() => import('@/src/components/ServerTime'), { ssr: false });
const UnderConstruction = dynamicImport(() => import('@/src/components/UnderConstruction'), { ssr: false });


// This line ensures the page is dynamically rendered on the server for each request
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
	const {firebaseServerApp} = await getAuthenticatedAppForUser();
    
	const filters = {
        category: searchParams.category || "",
        sortDirection: searchParams.sortDirection || ""
    };

	const restaurants = await getRestaurants(getFirestore(firebaseServerApp), filters);
	
	const isUnderConstruction = true; // Set this based on your app's state

	if (isUnderConstruction) {
	  return <UnderConstruction />
	}	
	
	return (
		<main className="main__home">
			<h1>Welcome to Analyst Server</h1>
			<ServerTime />			

		</main>
	);
}