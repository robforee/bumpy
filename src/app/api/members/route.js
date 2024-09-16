// src/app/api/members/route.js
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
import { getMembers } from "@/src/lib/firebase/firestore.js";
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'Member';

  try {
    const { firebaseServerApp } = await getAuthenticatedAppForUser();  
    const db = getFirestore(firebaseServerApp);
    
    const filters = {
      ...Object.fromEntries(searchParams.entries()),
      category: category
    };

    const members = await getMembers(db, filters);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}