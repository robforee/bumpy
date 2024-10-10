// src/app/page.js

import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
//import MembersComponent from '@/src/components/MembersComponent';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";
import { default as dynamicImport } from 'next/dynamic';


// Dynamically import ServerTime with no SSR
const UnderConstruction = dynamicImport(() => import('@/src/components/UnderConstruction'), { ssr: false });


// This line ensures the page is dynamically rendered on the server for each request
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
	
	// const idToken = await getIdToken(auth.currentUser);	
	// const {firebaseServerApp} = await getAuthenticatedAppForUser(idToken);
    
	// const filters = {
    //     category: searchParams.category || "",
    //     sortDirection: searchParams.sortDirection || ""
    // };

	// const restaurants = await getRestaurants(getFirestore(firebaseServerApp), filters);
	
	const isUnderConstruction = false; // Set this based on your app's state

	if (isUnderConstruction) {
	  return <UnderConstruction />
	}	
	
	return (
		<main className="main__home">
			<UnderConstruction />
			{/* <MembersComponent /> */}
		</main>
	);
}