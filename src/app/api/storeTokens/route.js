// src/app/api/storeTokens/route.js

import { getAdminFirestore } from '@/src/lib/firebase/adminApp';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { accessToken, refreshToken, userId } = await req.json();
  
  const db = getAdminFirestore();
  const userTokensRef = db.collection('user_tokens').doc(userId);
  
  // Calculate expiration time (1 hour from now)
  const expirationTime = Date.now() + 3600000; // 3600000 ms = 1 hour

  try {
    await userTokensRef.set({
      refreshToken: refreshToken,
      accessToken: accessToken,
      expirationTime: expirationTime,
      createdAt: new Date()
    }, { merge: true });
    
    return NextResponse.json({ message: 'Tokens stored successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error storing tokens:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}