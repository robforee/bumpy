// src/app/api/restaurants/route.js
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    const { firebaseServerApp } = await getAuthenticatedAppForUser();  
    const db = getFirestore(firebaseServerApp);
    
    const filters = {
      ...Object.fromEntries(searchParams.entries()),
      category: category || 'People'
    };

    const restaurants = await getRestaurants(db, filters);
    console.log('restaurants.length',restaurants.length)
    
    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}